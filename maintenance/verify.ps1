[CmdletBinding()]
param([switch]$Package, [ValidateRange(30,300)][int]$TimeoutSeconds=90)
. (Join-Path $PSScriptRoot 'common.ps1')
$root=Split-Path $PSScriptRoot -Parent
$m=Get-ProjectManifest $root
& (Join-Path $PSScriptRoot 'check.ps1')
& (Join-Path $PSScriptRoot 'tests.ps1')
$out=Join-Path $root 'test-output'
New-Item -ItemType Directory -Force -Path $out | Out-Null
$proofPath=Join-Path $out 'verification.json'
'{"passed":false,"status":"verification started"}' | Set-Content -LiteralPath $proofPath -Encoding UTF8
$sourceBefore=Get-SourceFingerprint $root $m
& (Join-Path $root 'desktop/build-desktop.ps1')
$buildBefore=Get-BuildFingerprint $root $m
$exe=Join-Path $root 'desktop/dist/Cthulhu-Investigator/Cthulhu-Investigator.exe'
$results=Join-Path (Split-Path $exe -Parent) 'runtime-test-results.json'
'PENDING: this run has not produced results' | Set-Content -LiteralPath $results -Encoding UTF8
$process=Start-Process -FilePath $exe -ArgumentList '--self-test' -WorkingDirectory (Split-Path $exe -Parent) -WindowStyle Hidden -PassThru
if (-not $process.WaitForExit($TimeoutSeconds*1000)) {
    Stop-Process -Id $process.Id -ErrorAction SilentlyContinue
    throw "WebView2 self-test timed out after $TimeoutSeconds seconds; old results cannot be used."
}
$process.Refresh()
if ($process.ExitCode -ne 0) { throw "Desktop self-test failed (exit $($process.ExitCode)); inspect $results" }
$groups=Read-GameResults $results $m.testGroups
if ($sourceBefore -cne (Get-SourceFingerprint $root $m) -or $buildBefore -cne (Get-BuildFingerprint $root $m)) { throw 'Inputs changed during verification. Run again after edits finish.' }
$proof=[ordered]@{schemaVersion=1;passed=$true;verifiedAt=[DateTimeOffset]::UtcNow.ToString('o');sourceFingerprint=$sourceBefore;buildFingerprint=$buildBefore;groups=$groups}
$proof | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $proofPath -Encoding UTF8
$total=($groups.PSObject.Properties.Value | Measure-Object -Sum).Sum
Write-Output ("Game verification PASS: "+$total+" checks. Record: test-output/verification.json")
if ($Package) { & (Join-Path $root 'desktop/package.ps1') }
