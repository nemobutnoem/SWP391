package com.swp391.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
<<<<<<< HEAD
<<<<<<< HEAD
import java.time.Instant;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {
	private final SecretKey key;
	private final String issuer;
	private final long accessTokenTtlMinutes;

	public JwtService(
			@Value("${app.jwt.secret}") String secret,
			@Value("${app.jwt.issuer}") String issuer,
			@Value("${app.jwt.access-token-ttl-minutes}") long accessTokenTtlMinutes
	) {
		if (secret == null || secret.length() < 32) {
			throw new IllegalArgumentException("app.jwt.secret must be at least 32 characters");
		}
		this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
		this.issuer = issuer;
		this.accessTokenTtlMinutes = accessTokenTtlMinutes;
	}

	public String generateAccessToken(Integer userId, String role) {
		Instant now = Instant.now();
		Instant exp = now.plusSeconds(accessTokenTtlMinutes * 60);
		return Jwts.builder()
				.issuer(issuer)
				.subject(String.valueOf(userId))
				.issuedAt(Date.from(now))
				.expiration(Date.from(exp))
				.claims(Map.of("role", role))
				.signWith(key)
				.compact();
	}

	public Claims parse(String token) {
		return Jwts.parser()
				.verifyWith(key)
				.build()
				.parseSignedClaims(token)
				.getPayload();
	}
=======
=======
>>>>>>> eb6e5285c66ffe32ec0db019fe1680dd33dd99ca
import java.util.Date;

@Service
public class JwtService {
    @Value("${app.jwt.secret:1234567890123456789012345678901234567890}")
    private String jwtSecret;
    
    @Value("${app.jwt.expiration-ms:86400000}")
    private long jwtExpirationMs;
    
    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
    
    public String generateAccessToken(Integer userId, String role) {
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(getSigningKey())
                .compact();
    }
    
    public Integer extractUserId(String token) {
        return Integer.parseInt(extractAllClaims(token).getSubject());
    }
    
    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }
    
    public boolean isTokenValid(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
<<<<<<< HEAD
>>>>>>> eb6e5285c66ffe32ec0db019fe1680dd33dd99ca
=======
>>>>>>> eb6e5285c66ffe32ec0db019fe1680dd33dd99ca
}
