/*
  SWP391 - SQL Server patch (2026-03-06)
  Goal: Add repo_name column to github_activities so we can filter commits by repository.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRAN;

    IF COL_LENGTH('dbo.github_activities', 'repo_name') IS NULL
    BEGIN
        ALTER TABLE dbo.github_activities ADD repo_name NVARCHAR(255) NULL;
        PRINT 'Added repo_name column to github_activities';
    END

    COMMIT;
    PRINT 'Patch applied successfully.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    PRINT 'ERROR: ' + ERROR_MESSAGE();
    THROW;
END CATCH
