package com.example.demo.controller;

import org.springframework.security.oauth2.jwt.Jwt;
import java.time.Instant;

public class JwtMockFactory {

    /**
     * Creates a mock Spring Security Jwt object with the given subject.
     */
    public static Jwt createJwt(String subject) {
        return Jwt.withTokenValue("mock-jwt-token-value")
                .header("alg", "EdDSA")
                .claim("sub", subject)
                .issuer("https://auth.neon.tech")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
    }
}