# Tools

## set-jira-github-integrations.ps1

Purpose: set per-group Jira/GitHub integration settings via backend API **without echoing tokens in terminal output**, then run a quick sync to verify data.

Run (PowerShell):

```powershell
# from repo root (D:\SWP391\SWP391)
.\tools\set-jira-github-integrations.ps1 -GroupId 1

# optional overrides
.\tools\set-jira-github-integrations.ps1 -GroupId 1 -Account lead1 -Password 'Lead@123' -ProjectKey 'SWP391GIT'
```

Notes:
- The script prompts for Jira email + Jira API token (masked).
- GitHub token is optional (press Enter to skip).
- Requires backend running at http://localhost:8080.
