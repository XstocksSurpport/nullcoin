# Windows Task Scheduler helper — run twice daily (09:00 and 21:00 local)
# Run once from PowerShell (as yourself):
#   cd C:\Users\TZH\Desktop\anti\marketing\twitter
#   .\schedule.ps1

$TaskName = 'NullProtocolTwitterMarketing'
$ScriptDir = $PSScriptRoot
$Node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $Node) { throw 'Node.js not found in PATH' }

$Action = New-ScheduledTaskAction -Execute $Node -Argument "post.mjs --next" -WorkingDirectory $ScriptDir
$Trigger1 = New-ScheduledTaskTrigger -Daily -At '09:00'
$Trigger2 = New-ScheduledTaskTrigger -Daily -At '21:00'
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger @($Trigger1, $Trigger2) -Settings $Settings -Force
Write-Host "Scheduled task '$TaskName' — posts at 09:00 and 21:00 daily."
Write-Host "Ensure marketing/twitter/.env has valid X API keys first."
Write-Host "Test manually: npm run post:dry"
