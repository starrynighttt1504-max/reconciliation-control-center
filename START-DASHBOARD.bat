@echo off
setlocal
cd /d "%~dp0"
start "Reconciliation Control Center" /min cmd /c "npm run dev -- --host 127.0.0.1"
timeout /t 3 /nobreak >nul
start "" "http://127.0.0.1:5173/"
endlocal
