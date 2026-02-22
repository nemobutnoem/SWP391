// Bám theo DBI: Users/Students/Course_Offerings/Groups/Jira_Tasks/Github_Activities/Jira_Projects/Github_Repositories
export const mockDb = {
  // current auth session (FE mock)
  session: {
    user: {
      id: 1,
      account: "student01",
      role: "Student", // Admin | Lecturer | Student
      email: "student01@fpt.edu.vn",
      github_username: "student01",
      jira_account_id: "jira-acc-01",
    },
    student: {
      id: 101,
      user_id: 1,
      full_name: "Nguyen Van A",
      student_code: "SE123456",
      status: "active",
      enrollment_year: 2023,
      major: "SE",
      phone_number: "0900000000",
    },
  },

  // system assigns offering, student can't choose -> we hardcode "currentOfferingId"
  currentOfferingId: 11,

  courseOfferings: [
    {
      id: 11,
      course_id: 1,
      semester: "SP26",
      start_date: "2026-01-05",
      end_date: "2026-04-10",
    },
  ],

  courses: [
    { id: 1, course_code: "SWP391", course_name: "Software Project" },
  ],

  projects: [
    {
      id: 201,
      course_offering_id: 11,
      project_code: "SWP-SP26-01",
      project_name: "Jira/GitHub Sync",
      description: "Sync requirements and commits",
      is_active: true,
      max_group: 10,
    },
  ],

  groups: [
    {
      id: 301,
      course_offering_id: 11,
      project_id: 201,
      group_name: "Group 1",
      description: "Team 1",
      status: "active",
      leader_student_id: 101,
    },
  ],

  groupMembers: [
    {
      id: 401,
      group_id: 301,
      student_id: 101,
      role_in_group: "Leader", // Leader | Member
      contribution_score: 0.0,
      joined_at: "2026-02-01T08:00:00Z",
    },
    {
      id: 402,
      group_id: 301,
      student_id: 102,
      role_in_group: "Member",
      contribution_score: 0.0,
      joined_at: "2026-02-01T08:00:00Z",
    },
  ],

  students: [
    {
      id: 101,
      user_id: 1,
      full_name: "Nguyen Van A",
      student_code: "SE123456",
      status: "active",
      enrollment_year: 2023,
      major: "SE",
      phone_number: "0900000000",
    },
    {
      id: 102,
      user_id: 2,
      full_name: "Tran Thi B",
      student_code: "SE123457",
      status: "active",
      enrollment_year: 2023,
      major: "SE",
      phone_number: "0900000001",
    },
  ],

  jiraProjects: [
    {
      id: 501,
      group_id: 301,
      jira_project_key: "SWP",
      jira_project_id: "10001",
      jira_base_url: "https://your-domain.atlassian.net",
    },
  ],

  githubRepositories: [
    {
      id: 601,
      group_id: 301,
      repo_url: "https://github.com/your-org/your-repo",
      repo_owner: "your-org",
      repo_name: "your-repo",
      default_branch: "main",
    },
  ],

  jiraTasks: [
    {
      id: 701,
      group_id: 301,
      jira_issue_key: "SWP-1",
      summary: "Create project skeleton",
      description: "Init FE structure, routing, guards",
      start_date: "2026-02-10",
      end_date: "2026-02-20",
      extend_date: null,
      parent_task_id: null,
      status: "To Do",
      priority: "Medium",
      assignee_user_id: 1,
      reporter_user_id: 1,
      created_at: "2026-02-10T08:00:00Z",
      updated_at: "2026-02-18T08:00:00Z",
    },
    {
      id: 702,
      group_id: 301,
      jira_issue_key: "SWP-2",
      summary: "Implement Auth context",
      description: "Fake login + RBAC",
      start_date: "2026-02-15",
      end_date: "2026-02-25",
      extend_date: null,
      parent_task_id: null,
      status: "In Progress",
      priority: "High",
      assignee_user_id: 1,
      reporter_user_id: 1,
      created_at: "2026-02-15T08:00:00Z",
      updated_at: "2026-02-21T08:00:00Z",
    },
  ],

  githubActivities: [
    {
      id: 801,
      group_id: 301,
      actor_user_id: 1,
      github_username: "student01",
      activity_type: "push",
      commit_sha: "abc123",
      commit_message: "Add AppProviders + Auth guards",
      ref_name: "main",
      pushed_commit_count: 2,
      occurred_at: "2026-02-21T09:00:00Z",
      raw_payload: {},
    },
    {
      id: 802,
      group_id: 301,
      actor_user_id: 2,
      github_username: "student02",
      activity_type: "commit",
      commit_sha: "def456",
      commit_message: "Implement TopicList UI",
      ref_name: "main",
      pushed_commit_count: 1,
      occurred_at: "2026-02-21T12:30:00Z",
      raw_payload: {},
    },
  ],

  syncLogs: [
    {
      id: 901,
      group_id: 301,
      at: "2026-02-21T08:00:00Z",
      action: "sync",
      result: "OK",
      detail: "Synced Jira tasks and GitHub activities",
    },
  ],
};