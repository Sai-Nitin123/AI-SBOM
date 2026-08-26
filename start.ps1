# AI-SBOM Platform PowerShell One-Click Launcher
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "            AI-SBOM PLATFORM -- ALL-IN-ONE LAUNCHER" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

Write-Host "[1/3] Starting Ollama Serve..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ollama serve"

Start-Sleep -Seconds 2

Write-Host "[2/3] Starting AI-SBOM Backend Gateway (Port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python api.py"

Start-Sleep -Seconds 2

Write-Host "[3/3] Starting Frontend Dashboard (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Start-Sleep -Seconds 3

Write-Host "[OK] All 3 services launched! Opening browser..." -ForegroundColor Green
Start-Process "http://localhost:5173"
