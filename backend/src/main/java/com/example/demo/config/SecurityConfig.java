package com.example.demo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

// Nimbus imports for direct manual verification
import com.nimbusds.jose.crypto.Ed25519Verifier;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.OctetKeyPair;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;

import java.net.URI;
import java.util.Arrays;
import java.util.Date;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${app.cors.allowed-origins}")
    private String[] allowedOrigins;

    @Value("${spring.jwk.set-uri}")
    private String jwkSetUri;

    @Value("${spring.jwt.issuer}")
    private String issuer;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/public/**").permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));

        return http.build();
    }

    @Bean
    public JwtDecoder jwtDecoder() throws Exception {
        JWKSet jwkSet = JWKSet.load(URI.create(jwkSetUri).toURL());
        OctetKeyPair okp = (OctetKeyPair) jwkSet.getKeys().get(0);
        Ed25519Verifier verifier = new Ed25519Verifier(okp);

        return token -> {
            try {
                SignedJWT signedJWT = SignedJWT.parse(token);

                if (!signedJWT.verify(verifier)) {
                    throw new BadJwtException("Invalid EdDSA signature");
                }

                JWTClaimsSet claims = signedJWT.getJWTClaimsSet();

                if (claims.getExpirationTime() != null && claims.getExpirationTime().before(new Date())) {
                    throw new BadJwtException("Token has expired");
                }

                if (!issuer.equals(claims.getIssuer())) {
                    throw new BadJwtException("Invalid issuer");
                }

                return Jwt.withTokenValue(token)
                        .headers(h -> h.putAll(signedJWT.getHeader().toJSONObject()))
                        .claims(c -> claims.getClaims().forEach((key, value) -> {
                            if (value instanceof Date) {
                                c.put(key, ((Date) value).toInstant());
                            } else if (key.equals("exp") || key.equals("iat") || key.equals("nbf")) {
                                c.put(key, java.time.Instant.ofEpochSecond(((Number) value).longValue()));
                            } else {
                                c.put(key, value);
                            }
                        }))
                        .build();

            } catch (Exception e) {
                throw new BadJwtException("Failed to decode JWT: " + e.getMessage(), e);
            }
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(allowedOrigins));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}