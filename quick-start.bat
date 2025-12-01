@echo off
:: quick startup -> backend (port 5000) + frontend (port 3000)
echo Starting SchedulAI...

:: Set the project directory
set PROJECT_DIR=%~dp0

echo Stopping any existing servers...
taskkill /f /im python.exe 2>nul
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Starting backend server...
start "SchedulAI Backend" cmd /k "cd /d "%PROJECT_DIR%" && echo Backend starting on port 5000... && python main.py"

echo Waiting for backend to initialize...
timeout /t 8 /nobreak >nul

echo Starting frontend server...
start "SchedulAI Frontend" cmd /k "cd /d "%PROJECT_DIR%frontend" && echo Frontend starting on port 3000... && npm start"

echo Waiting for frontend to start...
timeout /t 5 /nobreak >nul

echo Opening browser...
start http://localhost:3000

echo.
echo ==========================================
echo SchedulAI is starting up!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo ==========================================
echo.
echo Press any key to close this window...
pause >nul