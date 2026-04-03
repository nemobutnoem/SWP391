EXEC(N'IF COL_LENGTH(''dbo.jira_issues'',''srs_category'') IS NULL ALTER TABLE dbo.jira_issues ADD srs_category NVARCHAR(100) NULL')

-- Semester & Class business rules: class_type (MAIN=10w, CAPSTONE=3w) and prerequisite linking
EXEC(N'IF COL_LENGTH(''dbo.classes'',''class_type'') IS NULL ALTER TABLE dbo.classes ADD class_type NVARCHAR(20) NOT NULL DEFAULT ''MAIN''')
EXEC(N'IF COL_LENGTH(''dbo.classes'',''prerequisite_class_id'') IS NULL ALTER TABLE dbo.classes ADD prerequisite_class_id INT NULL')
EXEC(N'IF COL_LENGTH(''dbo.classes'',''start_date'') IS NULL ALTER TABLE dbo.classes ADD start_date DATE NULL')
EXEC(N'IF COL_LENGTH(''dbo.classes'',''end_date'') IS NULL ALTER TABLE dbo.classes ADD end_date DATE NULL')
