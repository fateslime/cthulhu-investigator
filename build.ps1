$ErrorActionPreference = 'Stop'
# Rebuild the archive portal and all four playable stories.
& (Join-Path $PSScriptRoot 'build-portal.ps1')
