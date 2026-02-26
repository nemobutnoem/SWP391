package com.swp391.compat;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.swp391.security.UserPrincipal;
import com.swp391.sync.OutboundSyncLogEntity;
import com.swp391.sync.OutboundSyncLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;

/**
 * Compatibility endpoints to match FE expectations.
 *
 * FE calls:
 * - GET /api/sync-logs
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CompatSyncLogController {
	private final OutboundSyncLogRepository outboundSyncLogRepository;

	public record SyncLogDto(
			Integer id,
			String action,
			String status,
			String at,
			@JsonProperty("detail") String detail
	) {
	}

	@GetMapping("/sync-logs")
	public List<SyncLogDto> list(@RequestParam(name = "groupId", required = false) Integer groupIdIgnored, Authentication auth) {
		// Outbound logs currently don't carry group_id; return logs requested by current user.
		UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
		return outboundSyncLogRepository.findAll().stream()
				.filter(l -> l.getRequestedByUserId() != null && l.getRequestedByUserId().equals(principal.getUserId()))
				.sorted(Comparator.comparing(OutboundSyncLogEntity::getId).reversed())
				.map(this::toDto)
				.toList();
	}

	private SyncLogDto toDto(OutboundSyncLogEntity e) {
		String at = null;
		if (e.getCreatedAt() != null) {
			at = e.getCreatedAt().toInstant(ZoneOffset.UTC).toString();
		}
		String status = normalizeStatus(e.getStatus());
		String action = buildAction(e);
		String detail = e.getErrorMessage();
		return new SyncLogDto(e.getId(), action, status, at, detail);
	}

	private String normalizeStatus(String s) {
		String v = s == null ? "" : s.trim().toUpperCase();
		if (v.equals("SUCCESS")) return "OK";
		if (v.equals("PENDING")) return "OK";
		return "ERROR";
	}

	private String buildAction(OutboundSyncLogEntity e) {
		String target = e.getTarget() == null ? "sync" : e.getTarget();
		String entityType = e.getEntityType() == null ? "entity" : e.getEntityType();
		String action = e.getAction() == null ? "action" : e.getAction();
		String remoteId = e.getRemoteId();
		return remoteId == null || remoteId.isBlank()
				? String.format("%s: %s %s", target, entityType, action)
				: String.format("%s: %s %s (%s)", target, entityType, action, remoteId);
	}
}
