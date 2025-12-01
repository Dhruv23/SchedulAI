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
cd /d "%PROJECT_DIR%"
start /b python main.py

echo Waiting for backend to initialize...
timeout /t 8 /nobreak >nul

echo Starting frontend server...
cd /d "%PROJECT_DIR%frontend"
npm start

echo Opening browser...
start http://localhost:3000/login

echo.
echo ==========================================
echo SchedulAI is starting up!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo ==========================================
echo.
echo Press any key to close this window...
pause >nul