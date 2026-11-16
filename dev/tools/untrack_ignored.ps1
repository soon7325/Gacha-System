$ErrorActionPreference = 'Stop'
try {
    Set-Location -LiteralPath (Join-Path $PSScriptRoot '../..')
    # Git produces one NUL-delimited record per path; no shell command interpolation.
    $start = New-Object System.Diagnostics.ProcessStartInfo
    $start.FileName = 'git'
    $start.WorkingDirectory = (Get-Location).Path
    $start.Arguments = 'ls-files --cached --ignored --exclude-standard -z'
    $start.UseShellExecute = $false
    $start.RedirectStandardOutput = $true
    $start.StandardOutputEncoding = New-Object System.Text.UTF8Encoding
    $process = [System.Diagnostics.Process]::Start($start)
    $paths = $process.StandardOutput.ReadToEnd()
    $process.WaitForExit()
    if ($process.ExitCode -ne 0) { throw 'Cannot list ignored tracked files.' }
    foreach ($relativePath in $paths.Split([char[]]@([char]0), [System.StringSplitOptions]::RemoveEmptyEntries)) {
        & git --literal-pathspecs rm --cached --ignore-unmatch -- $relativePath
        if ($LASTEXITCODE -ne 0) { throw 'Cannot untrack ignored file; local files were kept.' }
    }
    exit 0
} catch {
    Write-Error $_
    exit 1
}
