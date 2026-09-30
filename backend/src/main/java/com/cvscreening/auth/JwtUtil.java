package com.cvscreening.auth;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Optional;

/** Tao va xac thuc JSON Web Token (HS256). */
@Component
@Slf4j
public class JwtUtil {

    /** Gia tri mac dinh trong application.yml — chi danh cho dev local. */
    static final String DEFAULT_DEV_SECRET = "cv-screening-secret-key-change-me-in-production-2026";

    /** HS256 yeu cau khoa toi thieu 256 bit. */
    private static final int MIN_SECRET_BYTES = 32;

    private final SecretKey key;
    private final long expirationMs;

    public JwtUtil(@Value("${app.jwt.secret}") String secret,
                   @Value("${app.jwt.expiration-ms}") long expirationMs,
                   Environment environment) {
        boolean production = environment.acceptsProfiles(Profiles.of("prod"));
        byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException("JWT_SECRET phải dài tối thiểu " + MIN_SECRET_BYTES + " byte.");
        }
        if (DEFAULT_DEV_SECRET.equals(secret)) {
            if (production) {
                // Fail fast: secret nay nam cong khai trong repo, ai cung ky duoc token HR
                throw new IllegalStateException(
                        "Profile prod đang dùng JWT_SECRET mặc định của dev. Đặt JWT_SECRET ngẫu nhiên >= 32 byte.");
            }
            log.warn("JWT_SECRET đang dùng giá trị mặc định cho dev local — chỉ chấp nhận khi phát triển.");
        }
        this.key = Keys.hmacShaKeyFor(secretBytes);
        this.expirationMs = expirationMs;
    }

    public String generateToken(String email, String role) {
        Date now = new Date();
        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    /**
     * Email (subject) neu token hop le: dung chu ky, con han. Token sai/het han -> Optional.empty().
     * Parse DUNG MOT LAN (truoc day isValid() va extractEmail() moi ham parse lai mot lan).
     */
    public Optional<String> validSubject(String token) {
        try {
            return Optional.ofNullable(Jwts.parser().verifyWith(key).build()
                    .parseSignedClaims(token).getPayload().getSubject());
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
