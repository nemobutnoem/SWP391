package com.swp391.sync;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "outbound_sync_logs", schema = "dbo")
public class OutboundSyncLogEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@Column(name = "target")
	private String target;

	@Column(name = "entity_type")
	private String entityType;

	@Column(name = "entity_local_id")
	private Integer entityLocalId;

	@Column(name = "remote_id")
	private String remoteId;

	@Column(name = "action")
	private String action;

	@Column(name = "requested_by_user_id")
	private Integer requestedByUserId;

	@Column(name = "status")
	private String status;

	@Column(name = "error_message")
	private String errorMessage;

	@Column(name = "created_at", insertable = false, updatable = false)
	private LocalDateTime createdAt;
}
