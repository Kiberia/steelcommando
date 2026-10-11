$ErrorActionPreference = "Continue"
# Keep hero sheets + projectile; remove build scaffolding and idle extract
$remove = @(
  "C:\Users\MiniMac\steelcommando\assets\hero\_idle_frame0.png"
)
foreach ($p in $remove) {
  if (Test-Path $p) { Remove-Item -Force $p; Write-Output "removed $p" }
}

$tools = "C:\Users\MiniMac\steelcommando\tools"
if (Test-Path $tools) {
  Get-ChildItem $tools -File | ForEach-Object {
    Remove-Item -Force $_.FullName
    Write-Output ("removed tools/" + $_.Name)
  }
  if ((Get-ChildItem $tools -Force | Measure-Object).Count -eq 0) {
    Remove-Item -Force $tools
    Write-Output "removed tools/"
  }
}

$cursor = "C:\Users\MiniMac\.cursor\projects\c-Users-MiniMac-steelcommando\assets"
if (Test-Path $cursor) {
  Get-ChildItem $cursor -File | Where-Object { $_.Name -match "^(seq|wg|walk_|w0|hero_walk)" } | ForEach-Object {
    Remove-Item -Force $_.FullName
    Write-Output ("removed temp " + $_.Name)
  }
}

Write-Output "--- hero ---"
Get-ChildItem -Recurse "C:\Users\MiniMac\steelcommando\assets\hero" | Select-Object FullName, Length
