package com.swp391.tools;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class HashPassword {
	public static void main(String[] args) {
		if (args.length < 1) {
			System.err.println("Usage: HashPassword <plain>");
			System.exit(2);
		}
		String plain = args[0];
		var encoder = new BCryptPasswordEncoder();
		System.out.println(encoder.encode(plain));
	}
}
