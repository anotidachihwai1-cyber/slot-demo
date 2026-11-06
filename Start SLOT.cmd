@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo SLOT needs Node.js 22 or newer. Install it from https://nodejs.org then try again.
  pause
  exit /b 1
)
echo Open http://127.0.0.1:5173/ in your browser.
echo Keep this window open while using SLOT. Press Ctrl+C to stop.
node server.mjs
pause
