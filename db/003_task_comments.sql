/*
  SWP391 - Task Comments table
  Stores comments on jira_issues (tasks).
*/

IF OBJECT_ID('dbo.task_comments', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.task_comments (
        id            INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_task_comments PRIMARY KEY,
        task_id       INT            NOT NULL,
        user_id       INT            NOT NULL,
        content       NVARCHAR(MAX)  NOT NULL,
        created_at    DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at    DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT fk_task_comments_task FOREIGN KEY (task_id) REFERENCES dbo.jira_issues(id) ON DELETE CASCADE,
        CONSTRAINT fk_task_comments_user FOREIGN KEY (user_id) REFERENCES dbo.users(id)
    );

    CREATE INDEX idx_task_comments_task_id ON dbo.task_comments(task_id);
    CREATE INDEX idx_task_comments_user_id ON dbo.task_comments(user_id);

    PRINT 'Created dbo.task_comments';
END
GO
