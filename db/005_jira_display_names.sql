-- Add assignee_display_name and reporter_display_name to jira_issues
-- These store the Jira display names directly, so task assignment works
-- even when jira_account_id is not mapped on the users table.

ALTER TABLE dbo.jira_issues ADD assignee_display_name NVARCHAR(255) NULL;
ALTER TABLE dbo.jira_issues ADD reporter_display_name NVARCHAR(255) NULL;
