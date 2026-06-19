# Configure null.baby DNS on Dynadot for GitHub Pages (apex only, no www).
# Usage:
#   $env:DYNADOT_API_KEY = "your-api-key"
#   powershell -File scripts/dynadot-null-baby-dns.ps1
#
# Get API key: Dynadot → 工具 → API → 创建 API 密钥
# Docs: https://www.dynadot.com/domain/api3.html

param(
  [string]$Domain = "null.baby",
  [string]$ApiKey = $env:DYNADOT_API_KEY
)

$GitHubIps = @(
  "185.199.108.153",
  "185.199.109.153",
  "185.199.110.153",
  "185.199.111.153"
)

if (-not $ApiKey) {
  Write-Error "Set DYNADOT_API_KEY environment variable first."
  exit 1
}

$query = @{
  key     = $ApiKey
  command = "set_dns2"
  domain  = $Domain
}

for ($i = 0; $i -lt $GitHubIps.Count; $i++) {
  $query["main_record_type$i"] = "a"
  $query["main_record$i"] = $GitHubIps[$i]
}

$uri = "https://api.dynadot.com/api3.json?" + (($query.GetEnumerator() | ForEach-Object {
  "{0}={1}" -f [uri]::EscapeDataString($_.Key), [uri]::EscapeDataString([string]$_.Value)
}) -join "&")

Write-Host "Applying DNS for $Domain ..."
$response = Invoke-RestMethod -Uri $uri -Method Get
$response | ConvertTo-Json -Depth 6

$code = $response.SetDnsResponse.ResponseCode
if ($code -ne 0) {
  Write-Error "Dynadot API failed (ResponseCode=$code). Check API key and domain ownership."
  exit 1
}

Write-Host ""
Write-Host "Done. Apex A records set to GitHub Pages IPs."
Write-Host "No www record (recommended) — use https://null.baby"
Write-Host "Wait 5-10 min, then GitHub Pages -> Check again -> Enforce HTTPS."
