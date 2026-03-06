-- =====================================================
-- Migration script for SWP391 - Class Semester Hierarchy
-- =====================================================

-- 1. Add semester_id to classes table
IF COL_LENGTH('dbo.classes', 'semester_id') IS NULL
BEGIN
    ALTER TABLE dbo.classes ADD semester_id INT NULL;
    PRINT 'Added semester_id column to classes table';
END
GO

-- 2. Add Foreign Key constraints
IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_classes_semester'
)
BEGIN
    ALTER TABLE dbo.classes ADD CONSTRAINT FK_classes_semester
        FOREIGN KEY (semester_id) REFERENCES dbo.swp_semesters(id);
    PRINT 'Added FK_classes_semester constraint';
END
GO

-- 3. Backfill existing classes to point to SP26 (id=1, which was seeded in sqlserver_seed_20260223_swp391.sql)
UPDATE dbo.classes SET semester_id = 1 WHERE semester_id IS NULL;
PRINT 'Backfilled existing classes to semester_id = 1 (SP26)';
GO
