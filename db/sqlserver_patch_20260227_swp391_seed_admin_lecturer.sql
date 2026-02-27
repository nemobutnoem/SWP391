/*
  Seed additional login accounts: Admin + Lecturer
  - admin1 / Admin@123
  - lec1   / Lec@123

  Notes:
  - Roles are Title-case to match FE constants: "Admin", "Lecturer".
  - Uses BCrypt password_hash.
  - Idempotent: safe to run multiple times.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

-- Required SET options (filtered indexes / consistent behavior)
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;

BEGIN TRY
    BEGIN TRAN;

    DECLARE @adminAccount NVARCHAR(50) = N'admin1';
    DECLARE @lecAccount   NVARCHAR(50) = N'lec1';

    DECLARE @adminPassHash NVARCHAR(255) = N'$2a$10$GvDf7mNq0b7TyuwRgH5qkujrBZ/f3aU7ufb3Uob5dNfH6ioHm1CDi';
    DECLARE @lecPassHash   NVARCHAR(255) = N'$2a$10$PrUhlPe1CzDyXO3xnhMeeOSYCbgdR4zpGdiu./8dh6dBzaanMeb6W';

    /* =========================================================
       1) Admin user
       ========================================================= */
    DECLARE @adminUserId INT;

    SELECT @adminUserId = id
    FROM dbo.users
    WHERE account = @adminAccount;

    IF @adminUserId IS NULL
    BEGIN
        INSERT INTO dbo.users(account, role, github_username, jira_account_id, status, created_at, updated_at, password_hash)
        VALUES (@adminAccount, N'Admin', N'admin1-gh', N'admin1-jira', N'active', SYSUTCDATETIME(), SYSUTCDATETIME(), @adminPassHash);

        SET @adminUserId = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        UPDATE dbo.users
        SET
            role = COALESCE(role, N'Admin'),
            password_hash = COALESCE(password_hash, @adminPassHash),
            updated_at = SYSUTCDATETIME()
        WHERE id = @adminUserId;
    END

    /* =========================================================
       2) Lecturer user
       ========================================================= */
    DECLARE @lecUserId INT;

    SELECT @lecUserId = id
    FROM dbo.users
    WHERE account = @lecAccount;

    IF @lecUserId IS NULL
    BEGIN
        INSERT INTO dbo.users(account, role, github_username, jira_account_id, status, created_at, updated_at, password_hash)
        VALUES (@lecAccount, N'Lecturer', N'lec1-gh', N'lec1-jira', N'active', SYSUTCDATETIME(), SYSUTCDATETIME(), @lecPassHash);

        SET @lecUserId = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        UPDATE dbo.users
        SET
            role = COALESCE(role, N'Lecturer'),
            password_hash = COALESCE(password_hash, @lecPassHash),
            updated_at = SYSUTCDATETIME()
        WHERE id = @lecUserId;
    END

    /* =========================================================
       3) Lecturer profile (if table exists)
       ========================================================= */
    IF OBJECT_ID('dbo.lecturers', 'U') IS NOT NULL
    BEGIN
        DECLARE @lecId INT;

        SELECT @lecId = id
        FROM dbo.lecturers
        WHERE user_id = @lecUserId;

        IF @lecId IS NULL
        BEGIN
            INSERT INTO dbo.lecturers(user_id, full_name, email, status, created_at)
            VALUES (@lecUserId, N'Lecturer One', N'lec1@fpt.edu.vn', N'active', SYSUTCDATETIME());

            SET @lecId = SCOPE_IDENTITY();
        END

        -- Best-effort: assign lecturer to class SE1701 if column exists and currently NULL
        IF OBJECT_ID('dbo.classes', 'U') IS NOT NULL
           AND COL_LENGTH('dbo.classes', 'lecturer_id') IS NOT NULL
        BEGIN
            UPDATE dbo.classes
            SET lecturer_id = @lecId,
                updated_at = COALESCE(updated_at, SYSUTCDATETIME())
            WHERE class_code = N'SE1701'
              AND (lecturer_id IS NULL OR lecturer_id <> @lecId);
        END
    END

    COMMIT;
    PRINT N'✅ Seeded admin1 and lec1 successfully.';
    PRINT N'Login: admin1 / Admin@123';
    PRINT N'Login: lec1   / Lec@123';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    DECLARE @msg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @line INT = ERROR_LINE();
    PRINT N'❌ Seed failed at line ' + CAST(@line AS NVARCHAR(10)) + N': ' + @msg;
    THROW;
END CATCH;
