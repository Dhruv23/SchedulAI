@echo off
echo SchedulAI startup script


:: check for python dependencies
python -c "import flask, pandas, pdfplumber" 2>nul
if errorlevel 1 (
    echo Installing Python dependencies...
    pip install -r requirements.txt
)

:: check for frontend dependencies
if not exist "frontend\node_modules\" (
    echo Installing frontend dependencies...
    cd frontend
    npm install --silent
    cd ..
)

:: check if .env file exists
if not exist ".env" (
    echo ERROR: .env file is missing!
    pause
    exit /b 1
)

echo starting backend...
start "SchedulAI backend" cmd /k "python main.py"

timeout /t 5 /nobreak >nul

echo starting frontend...
start "SchedulAI frontend" cmd /k "cd frontend && npm start"

echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo Health:   http://localhost:5000/health

timeout /t 3 /nobreak >nul
start http://localhost:3000

pause