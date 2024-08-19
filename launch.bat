@echo off
setlocal

:: Set the port number
set PORT=2403

:: Check if Node is installed
:checknode
node --version >nul 2>&1 || goto :checkpython
:: set Node command
set EXEC=npx http-server -p %PORT% -c-1
:: Skip to running the server
goto :runserver


:: Check if Python is installed
:checkpython
python --version >nul 2>&1 || goto :noserver
:: Set Python command
set EXEC=python -m http.server %PORT%
:: Skip to running the server
goto :runserver


:: Abort if Node nor Python are installed
:noserver
echo No supported HTTP servers installed. Please install Node.js or Python.
pause
exit /b 1


:runserver
:: Start the web server
start "Tachibk Viewer" /D "%~dp0" "%COMSPEC%" /k "%EXEC%"
:: Open the default web browser with the demo data
start http://localhost:%PORT%/site?demo=1

endlocal
