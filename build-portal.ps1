$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
$gameRoot = $PSScriptRoot
function Build-Page([string]$file, [string[]]$artKeys) {
    $html = [System.IO.File]::ReadAllText((Join-Path $gameRoot $file))
    $styles = [regex]::Matches($html, '<link rel="stylesheet" href="([a-z-]+\.css)">')
    foreach ($match in $styles) {
        $css = [System.IO.File]::ReadAllText((Join-Path $gameRoot $match.Groups[1].Value))
        $html = $html.Replace($match.Value, "<style>`n$css`n</style>")
    }
    $art = @{}
    foreach ($key in $artKeys) {
        $bytes = [System.IO.File]::ReadAllBytes((Join-Path $gameRoot "assets/$key.png"))
        $art[$key] = 'data:image/png;base64,' + [Convert]::ToBase64String($bytes)
    }
    $scripts = New-Object System.Text.StringBuilder
    [void]$scripts.AppendLine(('window.SceneArt=' + (ConvertTo-Json -InputObject $art -Compress) + ';'))
    $matches = [regex]::Matches($html, '<script defer src="([a-z-]+\.js)"></script>')
    foreach ($match in $matches) {
        $contents = [System.IO.File]::ReadAllText((Join-Path $gameRoot $match.Groups[1].Value))
        [void]$scripts.AppendLine($contents)
        $html = $html.Replace($match.Value, '')
    }
    return $html.Replace('</body>', "<script>`n$scripts`n</script>`n</body>")
}
$legacy = Build-Page 'index.html' @('fog')
[System.IO.File]::WriteAllText((Join-Path $gameRoot 'Fogharbor-Original.html'), $legacy, $utf8)
$legacyJson = ConvertTo-Json -InputObject $legacy -Compress
[System.IO.File]::WriteAllText((Join-Path $gameRoot 'legacy-source.js'), ('window.CTHULHU_LEGACY = ' + $legacyJson.Replace('</','<\/') + ';'), $utf8)
$html = Build-Page 'portal.html' @('fog','asylum','train','tide','theatre')
foreach ($name in @('Cthulhu-Play.html','Fogharbor-Play.html')) {
    [System.IO.File]::WriteAllText((Join-Path $gameRoot $name), $html, $utf8)
    Write-Output "Built: $name"
}
