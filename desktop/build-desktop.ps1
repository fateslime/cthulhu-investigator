$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$sdkVersion = '1.0.4191.47'
$vendor = Join-Path $PSScriptRoot 'vendor'
$sdk = Join-Path $vendor 'webview2'
$package = Join-Path $vendor 'webview2.nupkg'
New-Item -ItemType Directory -Force -Path $vendor | Out-Null
if (-not (Test-Path (Join-Path $sdk 'lib/net462/Microsoft.Web.WebView2.Core.dll'))) {
    Invoke-WebRequest -Uri "https://api.nuget.org/v3-flatcontainer/microsoft.web.webview2/$sdkVersion/microsoft.web.webview2.$sdkVersion.nupkg" -OutFile $package -UseBasicParsing
    if ((Get-FileHash -LiteralPath $package -Algorithm SHA256).Hash -ne 'F492BBF547D0DA329553B6727435B677579B1E9F91CC9E4A1AD029366D5F23D0') { throw 'WebView2 package checksum mismatch.' }
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::ExtractToDirectory($package, $sdk)
}
& (Join-Path $root 'build-portal.ps1')
$dist = Join-Path $PSScriptRoot 'dist/Cthulhu-Investigator'
$content = Join-Path $dist 'content'
New-Item -ItemType Directory -Force -Path $content | Out-Null
$compiler = Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
if (-not (Test-Path $compiler)) { throw 'Windows .NET Framework 4.x C# compiler is required.' }
$references = @('System.dll','System.Core.dll','System.Windows.Forms.dll','System.Drawing.dll','System.Web.Extensions.dll',(Join-Path $sdk 'lib/net462/Microsoft.Web.WebView2.Core.dll'),(Join-Path $sdk 'lib/net462/Microsoft.Web.WebView2.WinForms.dll'))
$compilerArgs = @('/nologo','/target:winexe','/platform:x64','/optimize+','/codepage:65001',('/win32manifest:'+(Join-Path $PSScriptRoot 'app.manifest')),('/out:'+(Join-Path $dist 'Cthulhu-Investigator.exe')))
foreach ($reference in $references) { $compilerArgs += '/reference:' + $reference }
& $compiler @compilerArgs (Join-Path $PSScriptRoot 'Program.cs')
if ($LASTEXITCODE -ne 0) { throw 'Desktop app compilation failed.' }
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'App.config') -Destination (Join-Path $dist 'Cthulhu-Investigator.exe.config') -Force
Copy-Item -LiteralPath (Join-Path $sdk 'lib/net462/Microsoft.Web.WebView2.Core.dll'),(Join-Path $sdk 'lib/net462/Microsoft.Web.WebView2.WinForms.dll'),(Join-Path $sdk 'runtimes/win-x64/native/WebView2Loader.dll') -Destination $dist -Force
Copy-Item -LiteralPath (Join-Path $sdk 'LICENSE.txt') -Destination (Join-Path $dist 'WEBVIEW2-LICENSE.txt') -Force
Get-ChildItem -LiteralPath $root -File | Where-Object { $_.Extension -in @('.js','.css','.html') -and $_.Name -notin @('Cthulhu-Play.html','Fogharbor-Play.html','Fogharbor-Original.html') } | Copy-Item -Destination $content -Force
Copy-Item -LiteralPath (Join-Path $root 'assets') -Destination $content -Recurse -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'START-HERE.txt') -Destination $dist -Force
Write-Output "Built Windows x64 app: $dist"
