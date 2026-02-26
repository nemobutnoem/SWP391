/*
  SWP391 - SQL Server patch script (2026-02-26)
  Goal:
    - Fix 500 error when inserting outbound_sync_logs because dbo.outbound_sync_logs.action is too short.

  Symptom:
    String or binary data would be truncated in table 'SWP391.dbo.outbound_sync_logs', column 'action'.

  Notes:
    - This script is idempotent: it only widens the column if needed.
    - NVARCHAR max_length in sys.columns is stored in bytes (2 bytes per character).
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRAN;

    IF OBJECT_ID('dbo.outbound_sync_logs', 'U') IS NOT NULL
       AND COL_LENGTH('dbo.outbound_sync_logs', 'action') IS NOT NULL
    BEGIN
        DECLARE @maxLenBytes INT;
        DECLARE @maxLenChars INT;

        SELECT @maxLenBytes = c.max_length
        FROM sys.columns c
        WHERE c.object_id = OBJECT_ID('dbo.outbound_sync_logs')
          AND c.name = 'action';

        -- For NVARCHAR, max_length is bytes; divide by 2 to get chars.
        SET @maxLenChars = CASE
            WHEN @maxLenBytes IS NULL OR @maxLenBytes < 0 THEN 0
            ELSE @maxLenBytes / 2
        END;

        -- Widen action to NVARCHAR(255) if it's currently shorter.
        IF @maxLenChars > 0 AND @maxLenChars < 255
        BEGIN
            ALTER TABLE dbo.outbound_sync_logs
            ALTER COLUMN action NVARCHAR(255) NULL;
        END
    END

    COMMIT;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    THROW;
END CATCH;
