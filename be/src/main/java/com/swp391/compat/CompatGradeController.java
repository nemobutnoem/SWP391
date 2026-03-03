package com.swp391.compat;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

/**
 * Compatibility endpoint for FE calls to GET /api/grades.
 * No Grade table exists yet in the database, so this returns an empty list
 * to prevent 500 errors on the frontend.
 */
@RestController
@RequestMapping("/api")
public class CompatGradeController {

	@GetMapping("/grades")
	public List<?> listGrades(Authentication auth) {
		// TODO: implement when Grade entity/table is created
		return Collections.emptyList();
	}
}
