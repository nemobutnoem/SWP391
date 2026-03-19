EXEC(N'IF COL_LENGTH(''dbo.jira_issues'',''srs_category'') IS NULL ALTER TABLE dbo.jira_issues ADD srs_category NVARCHAR(100) NULL')
