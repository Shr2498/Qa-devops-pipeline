@echo off
REM QA DevOps Pipeline Setup Script for Windows
REM This script sets up the development environment and runs initial quality checks

echo Starting QA DevOps Pipeline Setup...

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ and try again.
    exit /b 1
)

REM Check Node.js version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [INFO] Node.js found: %NODE_VERSION%

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed. Please install npm and try again.
    exit /b 1
)

REM Install dependencies
echo [INFO] Installing project dependencies...
call npm ci
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)
echo [INFO] Dependencies installed successfully!

REM Run linting
echo [INFO] Running code linting...
call npm run lint
if %errorlevel% neq 0 (
    echo [ERROR] Linting failed. Please fix the issues and try again.
    exit /b 1
)
echo [INFO] Linting passed!

REM Run security audit
echo [INFO] Running security audit...
call npm audit --audit-level moderate
if %errorlevel% neq 0 (
    echo [WARNING] Security vulnerabilities found. Please review and fix.
)

REM Run unit tests
echo [INFO] Running unit tests...
call npm run test:unit
if %errorlevel% neq 0 (
    echo [ERROR] Unit tests failed. Please fix the issues and try again.
    exit /b 1
)
echo [INFO] Unit tests passed!

REM Run integration tests
echo [INFO] Running integration tests...
call npm run test:integration
if %errorlevel% neq 0 (
    echo [ERROR] Integration tests failed. Please fix the issues and try again.
    exit /b 1
)
echo [INFO] Integration tests passed!

REM Check if Docker is available
where docker >nul 2>nul
if %errorlevel% equ 0 (
    echo [INFO] Building Docker image...
    docker build -t qa-devops-app:latest .
    if %errorlevel% neq 0 (
        echo [ERROR] Docker image build failed.
        exit /b 1
    )
    echo [INFO] Docker image built successfully!
) else (
    echo [WARNING] Docker not found. Skipping Docker build.
)

REM Generate quality report
echo.
echo ===================================
echo     QA DEVOPS PIPELINE REPORT
echo ===================================
echo Date: %date% %time%
echo Node.js Version: %NODE_VERSION%

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo NPM Version: %NPM_VERSION%

echo.
echo Quality Checks:
echo [PASS] Dependencies installed
echo [PASS] Code linting passed
echo [PASS] Security audit completed
echo [PASS] Unit tests passed
echo [PASS] Integration tests passed

where docker >nul 2>nul
if %errorlevel% equ 0 (
    echo [PASS] Docker image built
)

echo.
echo Next Steps:
echo 1. Run 'npm start' to start the application
echo 2. Run 'npm run test:e2e' for end-to-end tests
echo 3. Run 'docker-compose up' for full environment
echo 4. Access application at http://localhost:3000
echo ===================================

echo [INFO] Setup completed successfully!
pause
