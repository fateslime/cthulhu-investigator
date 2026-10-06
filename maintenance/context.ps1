[CmdletBinding()]
param([string]$Area='overview', [switch]$Symbols, [ValidateRange(1000,24000)][int]$MaxChars=14000)
. (Join-Path $PSScriptRoot 'common.ps1')
$root = Split-Path $PSScriptRoot -Parent
$m = Get-ProjectManifest $root
$areaProperty = $m.areas.PSObject.Properties[$Area]
if ($null -eq $areaProperty) { throw "Unknown area. Choose: $($m.areas.PSObject.Properties.Name -join ', ')" }
$a = $areaProperty.Value
$lines = [Collections.Generic.List[string]]::new()
$lines.Add("FOGHARBOR HANDOFF / area=$Area / character budget=$MaxChars")
$lines.Add("Available areas: $($m.areas.PSObject.Properties.Name -join ', ')")
$lines.Add($a.summary)
$lines.Add("Read next: $($a.docs -join ', ')")
$lines.Add("Validation: maintenance/check.ps1; maintenance/verify.ps1 [-Package]")
$lines.Add("Tests: $($a.tests -join ', ')")
$lines.Add("FILES (source only; no generated bundles or profiles)")
foreach ($file in $a.files) {
    $path = Resolve-ProjectFile $root $file
    $lines.Add(('{0} ({1:N0} bytes)' -f $file,(Get-Item -LiteralPath $path).Length))
    if ($Symbols -and $file.EndsWith('.js')) {
        $source = Get-Content -LiteralPath $path -Raw -Encoding UTF8
        $names = @([regex]::Matches($source,'\bfunction\s+([A-Za-z_$][\w$]*)\s*\(') | ForEach-Object {$_.Groups[1].Value} | Sort-Object -Unique)
        if ($names.Count) { $lines.Add('  Functions: '+(($names | Select-Object -First 60) -join ', ')); if ($names.Count -gt 60) { $lines.Add('  More functions omitted; search this file with rg.') } }
    }
}
$lines.Add("CURRENT STATE")
$lines.Add((Get-Content -LiteralPath (Join-Path $root 'docs/STATE.md') -Encoding UTF8 -Raw))
$lines.Add("PROJECT INSTRUCTIONS")
$lines.Add((Get-Content -LiteralPath (Join-Path $root 'AGENTS.md') -Encoding UTF8 -Raw))
$text = $lines -join [char]10
if ($text.Length -gt $MaxChars) { $notice=([char]10)+"[TRUNCATED: read named files selectively; character budget, not token count.]"; $text=$text.Substring(0,$MaxChars-$notice.Length)+$notice }
Write-Output $text
