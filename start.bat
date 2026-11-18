@echo off
title Prerana Assistive Learning Platform
cd /d "%~dp0"
echo ========================================================
echo   Starting Prerana Special Education Learning Tool
echo   Integrated Flask + MySQL Platform (Port 5000)
echo ========================================================
echo.
echo Opening in your web browser...
start "" powershell -NoProfile -Command "Start-Sleep -Milliseconds 1500; Start-Process 'http://localhost:5000'"
python app.py
pause
