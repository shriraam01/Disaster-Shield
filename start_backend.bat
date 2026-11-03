@echo off
title DisasterShield - Backend API Server
echo ========================================================
echo   DisasterShield: DAA Intelligent Disaster Evacuation
echo   Starting Flask REST API on http://127.0.0.1:5000
echo ========================================================
set PYTHONPATH=%CD%
python backend/app.py
pause
