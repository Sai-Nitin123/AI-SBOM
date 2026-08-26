@echo off
title AI-SBOM Security Platform Launcher
echo ======================================================================
echo             AI-SBOM PLATFORM -- ALL-IN-ONE LAUNCHER
echo ======================================================================
echo Starting Ollama, Backend Gateway, and Frontend UI in separate tabs...
echo.

:: 1. Launch Ollama in background window
start "Ollama Runtime" cmd /k "ollama serve"

:: Wait 2 seconds
timeout /t 2 /nobreak >nul

:: 2. Launch FastAPI Backend
start "AI-SBOM Backend (Port 8000)" cmd /k "python api.py"

:: Wait 2 seconds
timeout /t 2 /nobreak >nul

:: 3. Launch Frontend Vite Dev Server
start "AI-SBOM Frontend (Port 5173)" cmd /k "cd frontend && npm run dev"

:: Wait 3 seconds and open browser
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo [OK] All 3 services launched successfully!
echo Dashboard opened at http://localhost:5173
echo.
pause
