@echo off
:: quick startup -> backend (port 5000) + frontend (port 3000)
echo starting SchedulAI...

:: Set the project directory
set PROJECT_DIR=%~dp0

echo starting backend first...
start "SchedulAI backend" cmd /k "cd /d "%PROJECT_DIR%" && python main.py"

echo waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo starting frontend...
start "SchedulAI frontend" cmd /k "cd /d "%PROJECT_DIR%frontend" && npm start"

timeout /t 3 /nobreak >nul
echo opening browser...
start http://localhost:3000