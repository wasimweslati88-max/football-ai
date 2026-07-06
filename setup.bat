@echo off
chcp 65001 >nul
cls

echo ╔══════════════════════════════════════════════════════╗
echo ║     🏆 Football AI - Auto Setup Script               ║
echo ╚══════════════════════════════════════════════════════╝
echo.

:: Check Node.js
echo 📦 Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found!
    echo Please install Node.js from: https://nodejs.org
    echo Download the LTS version and install it.
    pause
    exit /b 1
)

for /f "tokens=*" %%a in ('node --version') do set NODE_VERSION=%%a
echo ✅ Node.js found: %NODE_VERSION%

:: Install dependencies
echo.
echo 📦 Installing dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies!
    pause
    exit /b 1
)
echo ✅ Dependencies installed!

:: Check .env
if not exist ".env" (
    echo.
    echo ⚠️  .env file not found!
    echo Creating .env from template...
    copy .env.example .env
    echo ✅ .env created!
    echo.
    echo ⚠️  IMPORTANT: Please edit .env file and add your:
    echo    1. API_FOOTBALL_KEY (from api-football.com)
    echo    2. MONGODB_URI (from mongodb.com/atlas)
    echo    3. JWT_SECRET (any random long text)
    echo    4. ADMIN_PASSWORD (your admin password)
    echo.
    pause
)

:: Seed admin
echo.
echo 👤 Creating admin user...
call npm run seed
echo ✅ Admin user created!

:: Start server
echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║     🚀 Starting Football AI Server...                ║
echo ╚══════════════════════════════════════════════════════╝
echo.
echo ✅ Server is starting!
echo.
echo 📱 Open your browser and go to:
echo    http://localhost:10000
echo.
echo 🔐 Admin Panel: http://localhost:10000/admin
echo.
echo Press Ctrl+C to stop the server
echo.

npm start
