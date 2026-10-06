Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
function Resolve-ProjectFile([string]$Root, [string]$Relative) {
    if ([IO.Path]::IsPathRooted($Relative)) { throw "Expected a project-relative path: $Relative" }
    $base = [IO.Path]::GetFullPath($Root).TrimEnd('\','/') + [IO.Path]::DirectorySeparatorChar
    $path = [IO.Path]::GetFullPath((Join-Path $base $Relative))
    if (-not $path.StartsWith($base, [StringComparison]::OrdinalIgnoreCase)) { throw "Path leaves project: $Relative" }
    return $path
}
function Get-ProjectManifest([string]$Root) {
    $m = Get-Content -LiteralPath (Resolve-ProjectFile $Root 'maintenance/project.json') -Encoding UTF8 -Raw | ConvertFrom-Json
    if ($m.schemaVersion -ne 1) { throw 'Unsupported maintenance manifest version.' }
    return $m
}
function Get-RegisteredFiles($Manifest) {
    $files = foreach ($area in $Manifest.areas.PSObject.Properties) { $area.Value.files; $area.Value.tests }
    return @($files + $Manifest.assets | Sort-Object -Unique)
}
function Assert-PageAssets([string]$Html, $Expected, [string]$Name) {
    foreach ($kind in @('scripts','styles')) {
        $pattern = if ($kind -eq 'scripts') { '<script\s+[^>]*src="([^"]+)"[^>]*>' } else { '<link\s+rel="stylesheet"\s+href="([^"]+)"[^>]*>' }
        $actual = @([regex]::Matches($Html,$pattern) | ForEach-Object { $_.Groups[1].Value })
        $wanted = @($Expected.$kind)
        if (($actual -join '|') -cne ($wanted -join '|')) { throw "$Name $kind order differs from maintenance/project.json" }
        if (@($actual | Sort-Object -Unique).Count -ne $actual.Count) { throw "$Name loads duplicate $kind" }
    }
}
function Read-GameResults([string]$Path, [string[]]$Groups) {
    $report = Get-Content -LiteralPath $Path -Raw -Encoding UTF8 | ConvertFrom-Json
    $summary = [ordered]@{}
    foreach ($name in $Groups) {
        $property = $report.PSObject.Properties[$name]
        if ($null -eq $property -or $property.Value -isnot [string] -or -not $property.Value.TrimStart().StartsWith('[')) { throw "Missing or invalid test group: $name" }
        $decoded = $property.Value | ConvertFrom-Json
        $rows = @($decoded)
        if ($rows.Count -eq 0) { throw "Empty test group: $name" }
        foreach ($row in $rows) {
            if ($null -eq $row -or $null -eq $row.PSObject.Properties['pass'] -or $row.pass -isnot [bool] -or -not $row.pass -or $null -eq $row.PSObject.Properties['name'] -or [string]::IsNullOrWhiteSpace($row.name)) {
                throw "Invalid or failed test in $name : $($row | ConvertTo-Json -Compress)"
            }
        }
        $summary[$name] = $rows.Count
    }
    return [PSCustomObject]$summary
}
function Get-FileSetFingerprint([string]$Root, [string[]]$Files) {
    $lines = foreach ($file in ($Files | Sort-Object -Unique)) {
        $path = Resolve-ProjectFile $Root $file
        if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Missing fingerprint input: $file" }
        $file.Replace('\','/') + ':' + (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash
    }
    $sha = [Security.Cryptography.SHA256]::Create()
    try { return ([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes(($lines -join [char]10))))).Replace('-','').ToLowerInvariant() }
    finally { $sha.Dispose() }
}
function Get-SourceFingerprint([string]$Root, $Manifest) {
    return Get-FileSetFingerprint $Root (Get-RegisteredFiles $Manifest)
}
function Get-BuildFingerprint([string]$Root, $Manifest) {
    $base = 'desktop/dist/Cthulhu-Investigator/'
    $files = @($Manifest.generated) + @('Cthulhu-Investigator.exe','Cthulhu-Investigator.exe.config','Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.WinForms.dll','WebView2Loader.dll','WEBVIEW2-LICENSE.txt','START-HERE.txt' | ForEach-Object { $base + $_ })
    $content = Resolve-ProjectFile $Root ($base + 'content')
    if (-not (Test-Path -LiteralPath $content -PathType Container)) { throw 'Built content folder is missing.' }
    $prefix = [IO.Path]::GetFullPath($Root).TrimEnd('\','/') + [IO.Path]::DirectorySeparatorChar
    $files += @(Get-ChildItem -LiteralPath $content -Recurse -File | ForEach-Object { $_.FullName.Substring($prefix.Length).Replace('\','/') })
    return Get-FileSetFingerprint $Root $files
}
function Assert-VerifiedBuild([string]$Root, $Manifest) {
    $proofPath = Resolve-ProjectFile $Root 'test-output/verification.json'
    if (-not (Test-Path -LiteralPath $proofPath)) { throw 'No verification record. Run maintenance/verify.ps1 -Package first.' }
    $proof = Get-Content -LiteralPath $proofPath -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($proof.passed -isnot [bool] -or -not $proof.passed -or $proof.sourceFingerprint -cne (Get-SourceFingerprint $Root $Manifest) -or $proof.buildFingerprint -cne (Get-BuildFingerprint $Root $Manifest)) {
        throw 'Verification is stale or failed. Run maintenance/verify.ps1 -Package again.'
    }
}
