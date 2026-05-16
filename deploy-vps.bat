@echo off
setlocal enabledelayedexpansion
title DMS REPORT V4 - DEPLOYMENT

echo [INFO] --- BAT DAU DEPLOY MOI ---

:: 1. TU DONG NAP PATH
echo [INFO] Dang nap bien moi truong...
set PATH=%PATH%;C:\Program Files\nodejs\;%APPDATA%\npm

:: 2. KIEM TRA QUYEN ADMIN
echo [INFO] Dang kiem tra quyen Administrator...
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [LOI] Script nay can chay voi quyen Administrator!
    exit /b 1
)

:: 3. KIEM TRA MOI TRUONG
echo [INFO] Dang kiem tra Node.js...
node -v
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay Node.js trong PATH.
    exit /b 1
)

:: 4. DON DEP TRUOC KHI BUILD
echo [INFO] Dang dung cac dich vu cu...
set PM2_HOME=%USERPROFILE%\.pm2
call pm2 delete web_v4 2>nul
taskkill /f /im node.exe 2>nul

if exist ".next" (
    echo [INFO] Dang xoa thu muc build cu...
    rmdir /s /q ".next"
)

:: 5. CAI DAT VA BUILD
echo [BUOC 1] Dang cai dat thu viền...
call npm install
if %errorlevel% neq 0 (
    echo [LOI] npm install that bai!
    exit /b 1
)

echo [BUOC 2] Dang build du an Next.js...
call npm run build
if %errorlevel% neq 0 (
    echo [LOI] npm run build that bai!
    exit /b 1
)

:: 6. CHUAN BI STANDALONE
echo [BUOC 3] Dang chuan bi file Standalone...
if not exist ".next\standalone\.next\static" mkdir ".next\standalone\.next\static"
xcopy /y /e /s /i ".next\static" ".next\standalone\.next\static" >nul
if not exist ".next\standalone\public" mkdir ".next\standalone\public"
xcopy /y /e /s /i "public" ".next\standalone\public" >nul
copy /y ".env" ".next\standalone\.env" >nul

:: 7. KHOI CHAY UNG DUNG
echo [BUOC 4] Dang khoi chay bang PM2...
set HOSTNAME=0.0.0.0
set PORT=3000
set RUNNER_TRACKING_ID=dontkillme

cd /d "%~dp0.next\standalone"
call pm2 delete web_v4 2>nul
call pm2 start server.js --name "web_v4"
call pm2 save

:: 8. KHOI CHAY CADDY
echo [INFO] Dang khoi dong lai Caddy...
cd /d "%~dp0"
if exist "Caddyfile" (
    caddy stop 2>nul
    caddy start --config Caddyfile
)

echo [OK] Trien khai hoan tat!
exit /b 0
