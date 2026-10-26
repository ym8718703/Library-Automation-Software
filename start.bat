@echo off
setlocal EnableDelayedExpansion

title Library Management System - Launcher
set "ROOT_DIR=%~dp0"

echo ======================================================================
echo   Library Management System - Launcher [RBT 63 and 65]
echo   Powered by MySQL 8.0, Node.js Express and React Vite
echo ======================================================================
echo.

:: 1. Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js was not found in your PATH!
    echo Please install Node.js from https://nodejs.org/ and try again.
    echo.
    pause
    exit /b 1
)

:: 2. Check MySQL Service (informational)
sc query MySQL80 >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [OK] MySQL 8.0 Service detected.
) else (
    echo [INFO] Make sure your MySQL Server is running on port 3306.
)

:: 3. Check and install backend dependencies if missing
if not exist "!ROOT_DIR!backend\node_modules" (
    echo.
    echo [SETUP] Installing backend dependencies...
    cd /d "!ROOT_DIR!backend"
    call npm.cmd install
)

:: 4. Check and install frontend dependencies if missing
if not exist "!ROOT_DIR!frontend\node_modules" (
    echo.
    echo [SETUP] Installing frontend dependencies...
    cd /d "!ROOT_DIR!frontend"
    call npm.cmd install
)

echo.
echo [1/2] Starting Backend Server on port 5000...
cd /d "!ROOT_DIR!backend"
start "LMS Backend Server" cmd.exe /k "npm.cmd run dev"

echo [2/2] Starting Frontend Client on port 5173...
cd /d "!ROOT_DIR!frontend"
start "LMS Frontend Client" cmd.exe /k "npm.cmd run dev"

cd /d "!ROOT_DIR!"

echo.
echo Waiting 3 seconds for servers to initialize...
ping 127.0.0.1 -n 4 >nul

echo Opening browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo ======================================================================
echo   Application successfully launched!
echo.
echo   - Web UI:      http://localhost:5173
echo   - Backend API: http://localhost:5000/api
echo   - Database:    MySQL [library_management]
echo.
echo   Keep the Backend and Frontend command windows open while working.
echo   To stop the system, simply close those two command windows.
echo ======================================================================
echo.
pause
