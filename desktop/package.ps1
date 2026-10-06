$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
. (Join-Path $root 'maintenance/common.ps1')
& (Join-Path $root 'maintenance/check.ps1')
Assert-VerifiedBuild $root (Get-ProjectManifest $root)
$dist = Join-Path $PSScriptRoot 'dist/Cthulhu-Investigator'
$release = Join-Path $PSScriptRoot 'dist/release'
$stage = Join-Path $release ('stage-' + [Guid]::NewGuid().ToString('N'))
$app = Join-Path $stage 'Cthulhu-Investigator'
New-Item -ItemType Directory -Force -Path $app | Out-Null
foreach ($name in @('Cthulhu-Investigator.exe','Cthulhu-Investigator.exe.config','Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.WinForms.dll','WebView2Loader.dll','WEBVIEW2-LICENSE.txt','START-HERE.txt')) {
    Copy-Item -LiteralPath (Join-Path $dist $name) -Destination $app
}
Copy-Item -LiteralPath (Join-Path $dist 'content') -Destination $app -Recurse
$zip = Join-Path $release 'Cthulhu-Investigator-Windows-x64.zip'
Compress-Archive -LiteralPath $app -DestinationPath $zip -Force
$browser = Join-Path $release 'Cthulhu-Investigator-Browser.zip'
Compress-Archive -LiteralPath (Join-Path $root 'Cthulhu-Play.html') -DestinationPath $browser -Force
Get-FileHash -LiteralPath $zip,$browser -Algorithm SHA256 | ForEach-Object { $_.Hash.ToLowerInvariant() + '  ' + [System.IO.Path]::GetFileName($_.Path) } | Set-Content -Encoding ASCII (Join-Path $release 'SHA256SUMS.txt')
Get-Item -LiteralPath $zip,$browser | Select-Object FullName,Length
