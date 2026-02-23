package com.swp391.github;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "github_activities", schema = "dbo")
public class GithubActivityEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@Column(name = "group_id")
	private Integer groupId;

	@Column(name = "actor_user_id")
	private Integer actorUserId;

	@Column(name = "github_username")
	private String githubUsername;

	@Column(name = "activity_type")
	private String activityType;

	@Column(name = "commit_sha")
	private String commitSha;

	@Column(name = "commit_message")
	private String commitMessage;

	@Column(name = "ref_name")
	private String refName;

	@Column(name = "pushed_commit_count")
	private Integer pushedCommitCount;

	@Column(name = "occurred_at")
	private LocalDateTime occurredAt;

	@Column(name = "github_event_id")
	private String githubEventId;
}
