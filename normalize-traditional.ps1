$ErrorActionPreference = 'Stop'
if (-not ('ChronicleLocale' -as [type])) {
    Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class ChronicleLocale {
    [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)]
    public static extern int LCMapStringEx(string locale, uint flags, string source, int sourceLength, StringBuilder destination, int destinationLength, IntPtr version, IntPtr reserved, int sort);
}
'@
}
$utf8 = New-Object System.Text.UTF8Encoding($false)
foreach ($file in @('story-asylum.js','story-train.js','story-tide.js','chronicles-branches.js','story-theatre.js','story-recaps.js','theatre-engine.js')) {
    $target = Join-Path $PSScriptRoot $file
    $source = [System.IO.File]::ReadAllText($target)
    $ending = if ($file -in @('story-recaps.js','theatre-engine.js')) { '})(globalThis);' } else { '})(ChroniclesData);' }
    $endAt = $source.LastIndexOf($ending)
    if ($endAt -lt 0) { throw "Unexpected story file: $file" }
    $source = $source.Substring(0,$endAt + $ending.Length) + "`n"
    $buffer = New-Object System.Text.StringBuilder ($source.Length * 2)
    $count = [ChronicleLocale]::LCMapStringEx('zh-CN',0x04000000,$source,-1,$buffer,$buffer.Capacity,[IntPtr]::Zero,[IntPtr]::Zero,0)
    if ($count -eq 0) { throw "Unicode conversion failed: $file" }
    $result = $buffer.ToString(0,$count - 1)
    if (($result.ToCharArray() | Where-Object { [int]$_ -eq 63 }).Count -gt ($source.ToCharArray() | Where-Object { [int]$_ -eq 63 }).Count) { throw "Lossy conversion rejected: $file" }
    [System.IO.File]::WriteAllText($target,$result,$utf8)
    Write-Output "Normalized: $file"
}
