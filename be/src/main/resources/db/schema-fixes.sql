EXEC(N'IF COL_LENGTH(''dbo.jira_issues'',''srs_category'') IS NULL ALTER TABLE dbo.jira_issues ADD srs_category NVARCHAR(100) NULL')

-- Semester & Class business rules: class_type (MAIN=10w, CAPSTONE=3w) and prerequisite linking
EXEC(N'IF COL_LENGTH(''dbo.classes'',''class_type'') IS NULL ALTER TABLE dbo.classes ADD class_type NVARCHAR(20) NOT NULL DEFAULT ''MAIN''')
EXEC(N'IF COL_LENGTH(''dbo.classes'',''prerequisite_class_id'') IS NULL ALTER TABLE dbo.classes ADD prerequisite_class_id INT NULL')
EXEC(N'IF COL_LENGTH(''dbo.classes'',''start_date'') IS NULL ALTER TABLE dbo.classes ADD start_date DATE NULL')
EXEC(N'IF COL_LENGTH(''dbo.classes'',''end_date'') IS NULL ALTER TABLE dbo.classes ADD end_date DATE NULL')

-- Class enrollments: allows a student to be enrolled in multiple classes (e.g. 10w active + 3w pre-enrolled)
EXEC(N'IF OBJECT_ID(''dbo.class_enrollments'', ''U'') IS NULL CREATE TABLE dbo.class_enrollments (id INT IDENTITY(1,1) PRIMARY KEY, student_id INT NOT NULL, class_id INT NOT NULL, status NVARCHAR(20) NOT NULL DEFAULT ''ACTIVE'', enrolled_at DATETIME2 DEFAULT GETDATE(), CONSTRAINT UQ_enrollment UNIQUE (student_id, class_id))')

-- Topics (projects): block_type (MAIN=10w, CAPSTONE=3w)
EXEC(N'IF COL_LENGTH(''dbo.projects'',''block_type'') IS NULL ALTER TABLE dbo.projects ADD block_type NVARCHAR(20) NOT NULL DEFAULT ''MAIN''')
