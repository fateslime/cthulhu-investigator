[CmdletBinding()]
param()
. (Join-Path $PSScriptRoot 'common.ps1')
$root = Split-Path $PSScriptRoot -Parent
$m = Get-ProjectManifest $root
$registered = @(Get-RegisteredFiles $m)
foreach ($file in $registered) {
    if (-not (Test-Path -LiteralPath (Resolve-ProjectFile $root $file) -PathType Leaf)) { throw "Registered file missing: $file" }
}
foreach ($page in $m.pages.PSObject.Properties) {
    $html = Get-Content -LiteralPath (Resolve-ProjectFile $root $page.Name) -Raw -Encoding UTF8
    Assert-PageAssets $html $page.Value $page.Name
    foreach ($file in @($page.Value.scripts) + @($page.Value.styles)) {
        if ($file -notin $registered -and $file -notin $m.generated) { throw "Unregistered page dependency: $file" }
    }
}
$actual = @(Get-ChildItem -LiteralPath $root -File | Where-Object { $_.Extension -in @('.js','.css','.html','.ps1') } | ForEach-Object { $_.Name })
$actual += @(Get-ChildItem -LiteralPath (Join-Path $root 'desktop') -File | Where-Object { $_.Extension -in @('.cs','.ps1','.config','.manifest') } | ForEach-Object { 'desktop/' + $_.Name })
$actual += @(Get-ChildItem -LiteralPath $PSScriptRoot -File | Where-Object { $_.Extension -in @('.ps1','.json') } | ForEach-Object { 'maintenance/' + $_.Name })
foreach ($file in $actual) { if ($file -notin $registered -and $file -notin $m.generated) { throw "Source file has no maintenance area: $file" } }
foreach ($item in $m.docLimits.PSObject.Properties) {
    $text = Get-Content -LiteralPath (Resolve-ProjectFile $root $item.Name) -Raw -Encoding UTF8
    if ($text.Length -gt $item.Value) { throw "$($item.Name) exceeds its context budget ($($item.Value) characters)." }
    foreach ($match in [regex]::Matches($text,'\[[^\]]+\]\(([^)]+)\)')) {
        $target = $match.Groups[1].Value.Trim('<','>').Split('#')[0]
        if (-not $target -or $target -match '^[a-zA-Z]+:') { continue }
        $parent = Split-Path $item.Name -Parent
        $relative = if ($parent) { Join-Path $parent $target } else { $target }
        if (-not (Test-Path -LiteralPath (Resolve-ProjectFile $root $relative))) { throw "Broken document link: $($item.Name) -> $target" }
    }
}
foreach ($area in $m.areas.PSObject.Properties) {
    foreach ($doc in $area.Value.docs) { if (-not (Test-Path -LiteralPath (Resolve-ProjectFile $root $doc))) { throw "Missing area document: $doc" } }
}
$ignore = Get-Content -LiteralPath (Join-Path $root '.gitignore') -Encoding UTF8
foreach ($file in $m.generated) { if (('/'+$file) -notin $ignore) { throw "Generated file must be ignored: $file" } }
if ('/test-output/' -notin $ignore -or '/desktop/dist/' -notin $ignore -or '/desktop/vendor/' -notin $ignore) { throw 'Build / verification outputs must be ignored.' }
Write-Output "Architecture check PASS: $($registered.Count) registered files, $($m.pages.PSObject.Properties.Name.Count) entry pages."
