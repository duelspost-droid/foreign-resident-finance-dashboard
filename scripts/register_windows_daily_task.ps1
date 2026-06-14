param(
  [string]$TaskName = "ForeignResidentFinanceDailyBatch",
  [string]$ProjectPath = "C:\tmp\foreign-resident-finance-dashboard",
  [string]$Time = "03:30"
)

$action = New-ScheduledTaskAction `
  -Execute "cmd.exe" `
  -Argument "/c cd /d `"$ProjectPath`" && npm run batch:daily"

$trigger = New-ScheduledTaskTrigger -Daily -At $Time
$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "Fetch and rebuild foreign resident finance dashboard data every day." `
  -Force

Write-Host "Registered daily task '$TaskName' at $Time for $ProjectPath"
