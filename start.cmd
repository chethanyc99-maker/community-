@echo off
title Prerana Assistive Learning Platform
cd /d "%~dp0"
echo ========================================================
echo   Starting Prerana Special Education Learning Tool
echo   Integrated Flask + MySQL Platform (Port 5000)
echo ========================================================
echo.
echo Opening in your web browser...
start "" "http://localhost:5000"

python app.py
if errorlevel 1 (
    echo.
    echo Trying with py launcher...
    py app.py
)
pause
