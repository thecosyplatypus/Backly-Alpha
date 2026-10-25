@echo off
cd /d "%~dp0"
taskkill /f /im Backly.exe >nul 2>&1
timeout /t 1 /nobreak >nul
if not exist "release\Backly-win32-x64\Backly.exe" (
  echo Backly is not built yet. Run BUILD_AND_RUN.bat first.
  pause
  exit /b 1
)
start "" "release\Backly-win32-x64\Backly.exe"
