@echo off
title Prerana Live Dev Server
cd /d "%~dp0"
echo ========================================================
echo   Starting Prerana Live Server with Auto-Reload...
echo ========================================================
python dev.py
pause
