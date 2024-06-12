@echo off
setlocal

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed. Please install Python first.
    pause
    exit /b 1
)

:: Set the port number
set "PORT=2403"

:: Get the directory of the batch file
set "DIR=%~dp0"

:: Change to the directory of the batch file
cd /d "%DIR%"

:: Start the web server
start "" "cmd.exe" /k "python -m http.server %PORT%"

:: Open the default web browser with index.html
start "" "http://localhost:%PORT%/index.html"

endlocal
pause
