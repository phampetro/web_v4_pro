@echo off
setlocal enabledelayedexpansion
title DMS REPORT V4 - DEPLOYMENT

:: THIET LAP NHAT KY
set LOG_FILE=deploy_log.txt
echo [%date% %time%] --- BAT DAU DEPLOY MOI --- > %LOG_FILE%

:: 1. TU DONG NAP PATH (Fix loi khong tim thay npm/pm2 khi chay an)
echo [INFO] Dang nap bien moi truong... >> %LOG_FILE%
set PATH=%PATH%;C:\Program Files\nodejs\;C:\Users\Administrator\AppData\Roaming\npm\

:: 2. KIEM TRA QUYEN ADMIN
echo [INFO] Dang kiem tra quyen Administrator... >> %LOG_FILE%
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [LOI] Script nay can chay voi quyen Administrator! >> %LOG_FILE%
    exit /b 1
)

:: 3. KIEM TRA MOI TRUONG
echo [INFO] Dang kiem tra Node.js... >> %LOG_FILE%
node -v >> %LOG_FILE% 2>&1
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay Node.js trong PATH. >> %LOG_FILE%
    exit /b 1
)

:: 4. DON DEP TRUOC KHI BUILD
echo [INFO] Dang dung cac dich vu cu... >> %LOG_FILE%
set PM2_HOME=C:\Users\Administrator\.pm2
call pm2 delete web_v4 >> %LOG_FILE% 2>&1
taskkill /f /im node.exe >> %LOG_FILE% 2>&1

if exist ".next" (
    echo [INFO] Dang xoa thu muc build cu... >> %LOG_FILE%
    rmdir /s /q ".next" >> %LOG_FILE% 2>&1
)

:: 5. CAI DAT VA BUILD (QUAN TRONG)
echo [BUOC 1] Dang cai dat thu vien... >> %LOG_FILE%
call npm install >> %LOG_FILE% 2>&1
if %errorlevel% neq 0 (
    echo [LOI] npm install that bai! >> %LOG_FILE%
    exit /b 1
)

echo [BUOC 2] Dang build du an Next.js... >> %LOG_FILE%
call npm run build >> %LOG_FILE% 2>&1
if %errorlevel% neq 0 (
    echo [LOI] npm run build that bai! >> %LOG_FILE%
    exit /b 1
)

:: 6. CHUAN BI STANDALONE
echo [BUOC 3] Dang chuan bi file Standalone... >> %LOG_FILE%
if not exist ".next\standalone\.next\static" mkdir ".next\standalone\.next\static" >> %LOG_FILE% 2>&1
xcopy /y /e /s /i ".next\static" ".next\standalone\.next\static" >nul
if not exist ".next\standalone\public" mkdir ".next\standalone\public" >> %LOG_FILE% 2>&1
xcopy /y /e /s /i "public" ".next\standalone\public" >nul
copy /y ".env" ".next\standalone\.env" >nul

:: 7. KHOI CHAY UNG DUNG
echo [BUOC 4] Dang khoi chay bang PM2... >> %LOG_FILE%
set PM2_HOME=C:\Users\Administrator\.pm2
set HOSTNAME=0.0.0.0
set PORT=3000

:: THAN CHU: Ngan GitHub Runner giet tien trinh sau khi xong job
set RUNNER_TRACKING_ID=dontkillme

cd /d "D:\web_v4\web_v4_pro\.next\standalone"
call pm2 delete web_v4 >> %LOG_FILE% 2>&1
call pm2 start server.js --name "web_v4" --node-args="-r next/dist/server/next-utils.js" >> %LOG_FILE% 2>&1
call pm2 save >> %LOG_FILE% 2>&1

:: 8. KHOI CHAY CADDY
echo [INFO] Dang khoi dong lai Caddy... >> %LOG_FILE%
cd /d "D:\web_v4\web_v4_pro"
if exist "Caddyfile" (
    caddy stop >> %LOG_FILE% 2>&1
    caddy start --config Caddyfile >> %LOG_FILE% 2>&1
)

echo [%date% %time%] --- DEPLOY THANH CONG --- >> %LOG_FILE%
echo [OK] Trien khai hoan tat!
exit /b 0
