@echo off
title DisasterShield - Launcher
echo ========================================================
echo   Starting DisasterShield Intelligent Evacuation System
echo ========================================================
echo Launching Backend Server on port 5000...
start cmd /k "start_backend.bat"

timeout /t 2 /nobreak >nul

echo Launching Frontend Server on port 5173...
start cmd /k "start_frontend.bat"

echo.
echo Both servers initiated!
echo Frontend: http://localhost:5173
echo Backend:  http://127.0.0.1:5000
echo ========================================================
pause
