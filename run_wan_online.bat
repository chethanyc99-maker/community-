@echo off
title Prerana Online WAN Tunnel (Mobile 4G/5G & Internet Access)
cd /d "%~dp0"

echo ================================================================
echo   PRERANA SPECIAL EDUCATION LEARNING PLATFORM
echo   Generating Public Online URL for Mobile Networks (4G/5G) & WAN
echo ================================================================
echo.
echo [1/2] Starting local Flask background web server on port 5000...
start /b python app.py > nul 2>&1

echo [2/2] Generating public secure HTTPS URL via LocalTunnel...
echo.
echo ----------------------------------------------------------------
echo   SHARE THE HTTPS LINK BELOW WITH MOBILE PHONES (4G/5G/WAN)
echo   (Any phone or computer anywhere in the world can access it!)
echo ----------------------------------------------------------------
echo.

npx --yes localtunnel --port 5000

pause
