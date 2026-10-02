@echo off
setlocal
cd /d "%~dp0"

echo.
echo   Writers Lab Online - prototype
echo   ==============================
echo.

rem A local web server is preferred: it lets the browser remember what you do
rem between page reloads. If Python is not installed the page still works when
rem opened directly, it just forgets changes when you reload.

set PYCMD=
where py >nul 2>&1 && set PYCMD=py -3
if "%PYCMD%"=="" ( where python >nul 2>&1 && set PYCMD=python )

if "%PYCMD%"=="" goto :nopython

echo   Starting a local server on http://localhost:8080
echo   Opening your browser...
echo.
echo   Leave this window open while you are demonstrating.
echo   Press Ctrl+C or close this window when you are finished.
echo.
start "" "http://localhost:8080/index.html"
%PYCMD% -m http.server 8080 --bind 127.0.0.1
goto :eof

:nopython
echo   Python was not found, so the page will be opened directly.
echo   Everything works, but the browser will not remember changes
echo   you make if you reload the page.
echo.
start "" "%~dp0index.html"
timeout /t 4 >nul
