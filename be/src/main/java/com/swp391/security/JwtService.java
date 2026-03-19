package com.swp391.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
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
}
