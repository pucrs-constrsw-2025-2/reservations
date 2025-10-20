# PowerShell script to run e2e tests for reservations
# This script ensures the database is running before tests

Write-Host "🧪 Reservations E2E Test Runner" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
$dockerRunning = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker is running" -ForegroundColor Green
Write-Host ""

# Check if PostgreSQL container is running
Write-Host "Checking PostgreSQL container..." -ForegroundColor Yellow
$postgresRunning = docker ps --filter "name=postgresql" --filter "status=running" -q
if (-not $postgresRunning) {
    Write-Host "⚠️  PostgreSQL container is not running. Starting it now..." -ForegroundColor Yellow
    Push-Location ..\..\
    docker-compose up postgresql -d
    Pop-Location
    
    Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    Write-Host "✅ PostgreSQL container started" -ForegroundColor Green
} else {
    Write-Host "✅ PostgreSQL container is running" -ForegroundColor Green
}
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
    Write-Host ""
}

# Run the tests
Write-Host "🚀 Running E2E tests..." -ForegroundColor Cyan
Write-Host ""
npm run test:e2e

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ All tests passed!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Some tests failed" -ForegroundColor Red
    exit 1
}
