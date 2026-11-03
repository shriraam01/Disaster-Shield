@echo off
cd /d "%~dp0"
title DisasterShield - Backend API Server
echo ========================================================
echo   DisasterShield: DAA Intelligent Disaster Evacuation
echo   Starting Flask REST API on http://127.0.0.1:5000
echo ========================================================
set PYTHONPATH=%~dp0
python backend\app.py
pause
