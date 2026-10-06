[CmdletBinding()]
param()
. (Join-Path $PSScriptRoot 'common.ps1')
$root=Split-Path $PSScriptRoot -Parent
$fixture=Join-Path $root ('test-output/maintenance-fixtures-'+[Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $fixture -Force | Out-Null
$script:maintenancePassed=0
function Assert-True([bool]$Value,[string]$Name) {
    if (-not $Value) { throw "Maintenance test failed: $Name" }
    $script:maintenancePassed++
}
function Assert-Rejected([scriptblock]$Action,[string]$Name) {
    $rejected=$false
    try { & $Action | Out-Null } catch { $rejected=$true }
    Assert-True $rejected $Name
}
$expected=[pscustomobject]@{scripts=@('a.js','b.js');styles=@('a.css')}
$html='<link rel="stylesheet" href="a.css"><script defer src="a.js"></script><script defer src="b.js"></script>'
Assert-PageAssets $html $expected 'fixture'
Assert-True $true 'Matching entry point'
Assert-Rejected { Assert-PageAssets ($html.Replace('a.js','temp.js').Replace('b.js','a.js').Replace('temp.js','b.js')) $expected 'fixture' } 'Reordered scripts'
Assert-Rejected { Assert-PageAssets ($html+'<script src="a.js"></script>') $expected 'fixture' } 'Duplicate scripts'
Assert-Rejected { Assert-PageAssets ($html.Replace('a.css','other.css')) $expected 'fixture' } 'Changed stylesheet'
Assert-Rejected { Resolve-ProjectFile $fixture '../outside.txt' } 'Project path escape'
$resultPath=Join-Path $fixture 'results.json'
$good='[{"name":"fixture","pass":true}]'
$report=[ordered]@{rules=$good;ui=$good}
$report|ConvertTo-Json|Set-Content -LiteralPath $resultPath -Encoding UTF8
$summary=Read-GameResults $resultPath @('rules','ui')
Assert-True ($summary.rules -eq 1 -and $summary.ui -eq 1) 'Valid test report'
Assert-Rejected { Read-GameResults $resultPath @('rules','ui','compact') } 'Missing test group'
foreach ($invalid in @('[]','[{"name":"x","pass":false}]','[{"name":"x","pass":"true"}]','[{"name":"x"}]','{"error":"timeout"}','[{"name":"","pass":true}]','not JSON')) {
    @{rules=$invalid}|ConvertTo-Json|Set-Content -LiteralPath $resultPath -Encoding UTF8
    Assert-Rejected { Read-GameResults $resultPath @('rules') } "Invalid report: $invalid"
}
if (-not ('Investigator.TestResults' -as [type])) {
    Add-Type -Path (Join-Path $root 'desktop/TestResults.cs') -ReferencedAssemblies 'System.dll','System.Web.Extensions.dll'
}
$encoded=ConvertTo-Json -InputObject $good -Compress
Assert-True ([Investigator.TestResults]::AllPassed([string[]]@($encoded,$encoded))) 'Native valid results'
Assert-True (-not [Investigator.TestResults]::AllPassed([string[]]@())) 'Native empty group list'
foreach ($invalid in @('[]','[{"name":"x","pass":false}]','[{"name":"x","pass":"true"}]','{"error":"timeout"}','[null]','[{"name":"","pass":true}]')) {
    $bad=ConvertTo-Json -InputObject $invalid -Compress
    Assert-True (-not [Investigator.TestResults]::AllPassed([string[]]@($encoded,$bad))) "Native rejects $invalid"
}
Assert-True (-not [Investigator.TestResults]::AllPassed([string[]]@('null'))) 'Native missing JS result'
$sample=Join-Path $fixture 'sample.js'
'one'|Set-Content -LiteralPath $sample -Encoding ASCII
$before=Get-FileSetFingerprint $fixture @('sample.js')
'two'|Set-Content -LiteralPath $sample -Encoding ASCII
Assert-True ($before -cne (Get-FileSetFingerprint $fixture @('sample.js'))) 'Source edits invalidate fingerprints'
$mini=[pscustomobject]@{areas=[pscustomobject]@{sample=[pscustomobject]@{files=@('sample.js');tests=@()}};assets=@();generated=@()}
Assert-Rejected { Assert-VerifiedBuild $fixture $mini } 'Missing verification blocks packaging'
$proofDir=Join-Path $fixture 'test-output'
New-Item -ItemType Directory -Path $proofDir -Force | Out-Null
@{passed=$true;sourceFingerprint='old';buildFingerprint='old'}|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $proofDir 'verification.json') -Encoding UTF8
Assert-Rejected { Assert-VerifiedBuild $fixture $mini } 'Stale source verification blocks packaging'
$app=Join-Path $fixture 'desktop/dist/Cthulhu-Investigator'
New-Item -ItemType Directory -Path (Join-Path $app 'content') -Force | Out-Null
foreach($name in @('Cthulhu-Investigator.exe','Cthulhu-Investigator.exe.config','Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.WinForms.dll','WebView2Loader.dll','WEBVIEW2-LICENSE.txt','START-HERE.txt','content/page.html')) { 'fixture'|Set-Content -LiteralPath (Join-Path $app $name) -Encoding ASCII }
@{passed=$true;sourceFingerprint=(Get-SourceFingerprint $fixture $mini);buildFingerprint=(Get-BuildFingerprint $fixture $mini)}|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $proofDir 'verification.json') -Encoding UTF8
Assert-VerifiedBuild $fixture $mini
Assert-True $true 'Matching verification allows packaging'
'edited'|Set-Content -LiteralPath (Join-Path $app 'content/page.html') -Encoding ASCII
Assert-Rejected { Assert-VerifiedBuild $fixture $mini } 'Edited build invalidates packaging'
$context=& (Join-Path $PSScriptRoot 'context.ps1') -Area ui -Symbols -MaxChars 1000
Assert-True ($context.Length -le 1000 -and $context.Contains('[TRUNCATED:')) 'Context budget enforced'
Assert-Rejected { & (Join-Path $PSScriptRoot 'context.ps1') -Area unknown } 'Unknown context area rejected'
Write-Output "Maintenance self-test PASS: $script:maintenancePassed checks."
