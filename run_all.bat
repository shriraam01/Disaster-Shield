@echo off
cd /d "%~dp0"
title DisasterShield - Launcher
echo ========================================================
echo   Starting DisasterShield Intelligent Evacuation System
echo ========================================================
echo Launching Backend Server on port 5000...
start "DisasterShield Backend" cmd /k "cd /d "%~dp0" && call start_backend.bat"

timeout /t 2 /nobreak >nul

echo Launching Frontend Server on port 5173...
start "DisasterShield Frontend" cmd /k "cd /d "%~dp0" && call start_frontend.bat"

echo.
echo Both servers initiated!
echo Frontend: http://localhost:5173
echo Backend:  http://127.0.0.1:5000
echo ========================================================
pause
