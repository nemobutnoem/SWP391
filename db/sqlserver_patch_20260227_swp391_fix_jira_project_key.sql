/*
  Patch: Fix Jira project key used by sync
  Context: Sync pulls Jira issues using dbo.jira_projects.jira_project_key.
           Seed script inserted N'SWP', but the actual Jira project key is N'SWP391GIT'.

  How to use:
    - Run as-is to update group_id = 1
    - Or change @GroupId / @NewProjectKey as needed
*/

DECLARE @GroupId INT = 1;
DECLARE @OldProjectKey NVARCHAR(255) = N'SWP';
DECLARE @NewProjectKey NVARCHAR(255) = N'SWP391GIT';

IF OBJECT_ID('dbo.jira_projects', 'U') IS NULL
BEGIN
    PRINT 'dbo.jira_projects does not exist. Nothing to patch.';
    RETURN;
END

IF EXISTS (
    SELECT 1
    FROM dbo.jira_projects
    WHERE group_id = @GroupId
      AND jira_project_key = @OldProjectKey
)
BEGIN
    UPDATE dbo.jira_projects
    SET jira_project_key = @NewProjectKey,
        updated_at = SYSUTCDATETIME()
    WHERE group_id = @GroupId
      AND jira_project_key = @OldProjectKey;

    PRINT CONCAT('✅ Updated dbo.jira_projects.jira_project_key for group_id=', @GroupId, ' from ', @OldProjectKey, ' to ', @NewProjectKey);
END
ELSE
BEGIN
    PRINT CONCAT('No row to update for group_id=', @GroupId, ' with jira_project_key=', @OldProjectKey, '.');
END
