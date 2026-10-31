# Creates a "Jarvis" shortcut on the Desktop that starts every service and opens Jarvis in the browser.
#   npm run install-shortcut                 Desktop shortcut
#   npm run install-shortcut -- -Startup     also start Jarvis automatically when you sign in to Windows
#   npm run install-shortcut -- -Remove      remove both shortcuts
param([switch]$Startup, [switch]$Remove)

$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$desktop = Join-Path ([Environment]::GetFolderPath('Desktop')) 'Jarvis.lnk'
$startupLink = Join-Path ([Environment]::GetFolderPath('Startup')) 'Jarvis.lnk'

if ($Remove) {
  foreach ($p in @($desktop, $startupLink)) { if (Test-Path $p) { Remove-Item $p; Write-Host "Removed $p" } }
  return
}

function New-JarvisShortcut($path, $windowStyle) {
  $shell = New-Object -ComObject WScript.Shell
  $s = $shell.CreateShortcut($path)
  $s.TargetPath = "$env:ComSpec"
  $s.Arguments = "/k title Jarvis services && cd /d `"$root`" && npm run dev -- --open"
  $s.WorkingDirectory = $root
  $s.WindowStyle = $windowStyle   # 1 = normal window, 7 = minimized
  $s.IconLocation = "$env:SystemRoot\System32\shell32.dll,43"
  $s.Description = 'Start Jarvis (AI service, API and web app) and open it in the browser'
  $s.Save()
  Write-Host "Created $path"
}

New-JarvisShortcut $desktop 1
if ($Startup) { New-JarvisShortcut $startupLink 7 }
Write-Host 'Double-click "Jarvis" on your Desktop to start everything. Close its window to stop Jarvis.'
