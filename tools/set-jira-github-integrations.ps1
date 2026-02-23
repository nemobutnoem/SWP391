param(
  [Parameter(Mandatory=$true)]
  [int]$GroupId,

  [string]$BaseUrl = "http://localhost:8080",

  [string]$Account = "lead1",
  [string]$Password = "Lead@123",

  [string]$JiraBaseUrl = "https://fpt-team-y8wit2i7.atlassian.net",
  [string]$ProjectKey = "SWP391GIT"
)

$ErrorActionPreference = "Stop"

function Read-PlainSecret([string]$Prompt) {
  $secure = Read-Host -Prompt $Prompt -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  }
  finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
}

Write-Host "Logging in as '$Account'..."
$loginBody = @{ account = $Account; password = $Password } | ConvertTo-Json
$loginResp = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/auth/login" -ContentType "application/json" -Body $loginBody
$jwt = $loginResp.accessToken

$jiraEmail = Read-Host -Prompt "Jira email (the email you login Jira with)"
$jiraToken = Read-PlainSecret "Jira API token (will not be echoed)"

$githubToken = Read-PlainSecret "GitHub token (optional - press Enter to skip)"

$putBody = @{
  jiraBaseUrl  = $JiraBaseUrl
  jiraEmail    = $jiraEmail
  jiraApiToken = $jiraToken
}
if ($githubToken -and $githubToken.Trim().Length -gt 0) {
  $putBody.githubToken = $githubToken
}

Write-Host "Updating integration settings for group $GroupId..."
$resp = Invoke-RestMethod -Method Put -Uri "$BaseUrl/api/groups/$GroupId/settings/integrations" `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $jwt" } `
  -Body ($putBody | ConvertTo-Json)

Write-Host "Saved. Current flags:" -ForegroundColor Green
$resp | ConvertTo-Json

Write-Host "Syncing Jira issues for projectKey='$ProjectKey'..."
$syncBody = @{ projectKey = $ProjectKey } | ConvertTo-Json
$syncResp = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/groups/$GroupId/jira/sync/issues" `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $jwt" } `
  -Body $syncBody

Write-Host "Jira sync done. Upserted: $syncResp" -ForegroundColor Green

Write-Host "Fetching Jira issues list..."
$issues = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/groups/$GroupId/jira/issues" -Headers @{ Authorization = "Bearer $jwt" }
$issues | ConvertTo-Json -Depth 6

if ($githubToken -and $githubToken.Trim().Length -gt 0) {
  Write-Host "Triggering GitHub sync..."
  $ghSync = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/groups/$GroupId/github/sync" -Headers @{ Authorization = "Bearer $jwt" }
  Write-Host "GitHub sync done. Inserted: $ghSync" -ForegroundColor Green

  Write-Host "Fetching GitHub stats..."
  $stats = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/groups/$GroupId/github/stats" -Headers @{ Authorization = "Bearer $jwt" }
  $stats | ConvertTo-Json -Depth 6
}
