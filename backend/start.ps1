# SkillSphere Backend — Start Script
# Run this from the backend\ directory: .\start.ps1

# Load environment variables from .env file
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | Where-Object { $_ -notmatch "^\s*#" -and $_ -match "=" } | ForEach-Object {
        $parts = $_ -split "=", 2
        $key   = $parts[0].Trim()
        $value = $parts[1].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
        Write-Host "  SET $key" -ForegroundColor DarkGray
    }
    Write-Host "✅ Environment loaded from .env" -ForegroundColor Green
} else {
    Write-Host "⚠️  No .env file found — using system environment variables" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Starting SkillSphere Backend..." -ForegroundColor Cyan
mvn spring-boot:run -o
