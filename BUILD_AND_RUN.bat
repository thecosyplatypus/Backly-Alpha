@echo off
cd /d "%~dp0"
taskkill /f /im Backly.exe >nul 2>&1
timeout /t 1 /nobreak >nul
echo ========================================
echo  Backly - Building Desktop App
echo ========================================
echo.

call npm run build
if %errorlevel% neq 0 (
  echo Build failed!
  pause
  exit /b %errorlevel%
)

call node scripts/package.js
if %errorlevel% neq 0 (
  echo Packaging failed!
  pause
  exit /b %errorlevel%
)

echo.
echo ========================================
echo  Launching Backly...
echo ========================================
start "" "release\Backly-win32-x64\Backly.exe"
