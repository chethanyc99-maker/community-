@echo off
title Prerana Multi-Network Server (Wi-Fi, LAN, Ethernet)
cd /d "%~dp0"

echo ================================================================
echo   PRERANA SPECIAL EDUCATION LEARNING PLATFORM
echo   Starting Flask + MySQL Server for Wi-Fi, LAN, and Mobile Devices
echo ================================================================
echo.

start "" powershell -NoProfile -Command "Start-Sleep -Milliseconds 1500; Start-Process 'http://localhost:5000'"
python app.py

pause
