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

// Nimbus imports for dynamic key selection and manual EdDSA verification
import com.nimbusds.jose.crypto.Ed25519Verifier;
import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.JWKMatcher;
import com.nimbusds.jose.jwk.JWKSelector;
import com.nimbusds.jose.jwk.OctetKeyPair;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.jwk.source.JWKSourceBuilder;
import com.nimbusds.jose.proc.SecurityContext;
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
        // 1. JWKSourceBuilder handles caching and automatic background refreshing of
        // the JWKS
        JWKSource<SecurityContext> jwkSource = JWKSourceBuilder
                .create(URI.create(jwkSetUri).toURL())
                .build();

        return token -> {
            try {
                SignedJWT signedJWT = SignedJWT.parse(token);
                String kid = signedJWT.getHeader().getKeyID();

                // 2. Dynamically select the correct key from the cached JWKS using the token's
                // 'kid'
                JWKSelector selector = new JWKSelector(new JWKMatcher.Builder().keyID(kid).build());
                List<JWK> jwks = jwkSource.get(selector, null);

                if (jwks.isEmpty()) {
                    throw new BadJwtException("No matching key found for kid: " + kid);
                }

                JWK jwk = jwks.get(0);
                if (!(jwk instanceof OctetKeyPair okp)) {
                    throw new BadJwtException("Expected OctetKeyPair for EdDSA signature verification");
                }

                // 3. Verify Cryptographic Signature
                Ed25519Verifier verifier = new Ed25519Verifier(okp);
                if (!signedJWT.verify(verifier)) {
                    throw new BadJwtException("Invalid EdDSA signature");
                }

                JWTClaimsSet claims = signedJWT.getJWTClaimsSet();
                Date now = new Date();

                // 4. Strict Temporal Validation: Enforce exp and nbf
                if (claims.getExpirationTime() == null || !claims.getExpirationTime().after(now)
                        || (claims.getNotBeforeTime() != null && claims.getNotBeforeTime().after(now))) {
                    throw new BadJwtException("Token is missing expiration, is not valid yet, or has expired");
                }

                // 5. Verify Issuer
                if (!issuer.equals(claims.getIssuer())) {
                    throw new BadJwtException("Invalid issuer");
                }

                // 6. Map to Spring Security Context with explicit Date -> Instant mapping
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