@echo off
title FileVault - Starting App...
echo Starting FileVault app...
cd /d "%~dp0"

:: Start the dev server in the background
start "" cmd /c "npm run dev"

:: Wait a few seconds for the server to boot
timeout /t 4 /nobreak >nul

:: Open the app in the default browser
start "" "http://localhost:5173"

echo App is running at http://localhost:5173
echo Close this window or press Ctrl+C to stop.
pause
