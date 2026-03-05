-- =====================================================
-- Migration v3: Grades table for Lecturer grading
-- =====================================================

IF NOT EXISTS (
    SELECT 1 FROM sys.objects
    WHERE object_id = OBJECT_ID('dbo.grades') AND type = 'U'
)
BEGIN
    CREATE TABLE dbo.grades (
        id INT IDENTITY(1,1) PRIMARY KEY,
        group_id INT NOT NULL REFERENCES dbo.groups(id),
        lecturer_id INT NOT NULL REFERENCES dbo.lecturers(id),
        milestone NVARCHAR(200) NULL,
        score DECIMAL(4,2) NULL,
        feedback NVARCHAR(1000) NULL,
        date DATE NULL,
        status VARCHAR(20) DEFAULT 'PENDING',
        created_at DATETIME2 DEFAULT GETDATE()
    );
    PRINT 'Created grades table';
END
GO
