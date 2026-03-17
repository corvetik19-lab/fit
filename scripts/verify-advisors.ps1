$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

function Resolve-BaseRef {
  if ($env:MIGRATION_DIFF_BASE -and $env:MIGRATION_DIFF_BASE.Trim()) {
    return $env:MIGRATION_DIFF_BASE.Trim()
  }

  if ($env:GITHUB_EVENT_PATH -and (Test-Path $env:GITHUB_EVENT_PATH)) {
    $payload = Get-Content -Raw -Path $env:GITHUB_EVENT_PATH | ConvertFrom-Json

    if ($payload.pull_request.base.sha) {
      return [string] $payload.pull_request.base.sha
    }

    if ($payload.before -and ($payload.before -notmatch '^0+$')) {
      return [string] $payload.before
    }
  }

  return 'HEAD~1'
}

function Collect-GitOutput {
  param(
    [Parameter(Mandatory = $true)]
    [string[]] $Arguments
  )

  $output = & git @Arguments

  if ($LASTEXITCODE -ne 0) {
    throw "git $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
  }

  return @($output | ForEach-Object {
      $line = $_.ToString().Trim()

      if ($line) {
        $line
      }
    })
}

$baseRef = Resolve-BaseRef
$changedFiles = New-Object System.Collections.Generic.List[string]

foreach ($path in (Collect-GitOutput -Arguments @('diff', '--name-only', "$baseRef...HEAD"))) {
  $changedFiles.Add($path)
}

if (-not $env:GITHUB_ACTIONS) {
  foreach ($path in (Collect-GitOutput -Arguments @('diff', '--name-only'))) {
    $changedFiles.Add($path)
  }

  foreach ($path in (Collect-GitOutput -Arguments @('diff', '--name-only', '--cached'))) {
    $changedFiles.Add($path)
  }

  foreach ($path in (Collect-GitOutput -Arguments @('ls-files', '--others', '--exclude-standard'))) {
    $changedFiles.Add($path)
  }
}

$normalizedFiles = @($changedFiles | Sort-Object -Unique)
$tempFile = [System.IO.Path]::GetTempFileName()
Set-Content -Path $tempFile -Value $normalizedFiles -Encoding utf8

$env:MIGRATION_DIFF_BASE = $baseRef
$env:MIGRATION_CHANGED_FILES_FILE = $tempFile

try {
  node scripts/verify-advisors.mjs
}
finally {
  if (Test-Path $tempFile) {
    Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
  }

  Remove-Item Env:MIGRATION_CHANGED_FILES_FILE -ErrorAction SilentlyContinue
}
