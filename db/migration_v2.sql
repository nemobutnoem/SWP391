-- =====================================================
-- Migration script for SWP391 - Missing BE Features
-- Run this BEFORE starting the application
-- =====================================================

-- 1. Add lecturer_id column to groups table (for Assign Lecturer to Group)
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.groups') AND name = 'lecturer_id'
)
BEGIN
    ALTER TABLE dbo.groups ADD lecturer_id INT NULL;
    ALTER TABLE dbo.groups ADD CONSTRAINT FK_groups_lecturer
        FOREIGN KEY (lecturer_id) REFERENCES dbo.lecturers(id);
    PRINT 'Added lecturer_id to groups table';
END
GO

-- 2. Create admin_integrations table (for Admin-level Jira/GitHub Config)
IF NOT EXISTS (
    SELECT 1 FROM sys.objects
    WHERE object_id = OBJECT_ID('dbo.admin_integrations') AND type = 'U'
)
BEGIN
    CREATE TABLE dbo.admin_integrations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        config_key VARCHAR(100) NOT NULL UNIQUE,
        config_value VARCHAR(500) NULL,
        updated_at DATETIME2 DEFAULT GETDATE()
    );

    -- Seed default config keys
    INSERT INTO dbo.admin_integrations (config_key) VALUES
        ('jira_base_url'),
        ('jira_email'),
        ('jira_api_token'),
        ('github_token');

    PRINT 'Created admin_integrations table with default keys';
END
GO
