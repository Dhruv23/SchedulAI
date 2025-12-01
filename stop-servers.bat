@echo off
:: Stop SchedulAI servers
echo Stopping SchedulAI servers...

echo Killing Python processes (Backend)...
taskkill /f /im python.exe 2>nul

echo Killing Node processes (Frontend)...  
taskkill /f /im node.exe 2>nul

timeout /t 2 /nobreak >nul

echo.
echo ==========================================
echo SchedulAI servers have been stopped.
echo ==========================================
echo.
echo Press any key to close this window...
pause >nul