/*
  SWP391 - Add missing columns for full Jira sync
  - Expand description to NVARCHAR(MAX)
  - Add labels, sprint_name, story_points columns
*/

IF COL_LENGTH('dbo.jira_issues', 'description') IS NOT NULL
BEGIN
    ALTER TABLE dbo.jira_issues ALTER COLUMN description NVARCHAR(MAX) NULL;
    PRINT 'Altered dbo.jira_issues.description to NVARCHAR(MAX)';
END
GO

IF COL_LENGTH('dbo.jira_issues', 'labels') IS NULL
BEGIN
    ALTER TABLE dbo.jira_issues ADD labels NVARCHAR(500) NULL;
    PRINT 'Added dbo.jira_issues.labels';
END
GO

IF COL_LENGTH('dbo.jira_issues', 'sprint_name') IS NULL
BEGIN
    ALTER TABLE dbo.jira_issues ADD sprint_name NVARCHAR(200) NULL;
    PRINT 'Added dbo.jira_issues.sprint_name';
END
GO

IF COL_LENGTH('dbo.jira_issues', 'story_points') IS NULL
BEGIN
    ALTER TABLE dbo.jira_issues ADD story_points FLOAT NULL;
    PRINT 'Added dbo.jira_issues.story_points';
END
GO
