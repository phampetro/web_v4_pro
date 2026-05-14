@echo off
setlocal enabledelayedexpansion
title DMS REPORT V4 - SETUP WIZARD

echo ======================================================
echo       DMS REPORT V4 - VPS SETUP WIZARD (WINDOWS)
echo ======================================================
echo.

:: 1. KIEM TRA DIEU KIEN CAN
echo [INFO] Dang kiem tra moi truong...

:: Tu dong tat IIS de giai phong cong 80
echo [INFO] Dang dung dich vu IIS (neu co) de giai phong cong 80...
net stop W3SVC /y >nul 2>&1
sc config W3SVC start= disabled >nul 2>&1

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay Node.js. Hay cai dat tai https://nodejs.org/
    pause & exit /b
)

if not exist "caddy.exe" (
    echo [LOI] Khong tim thay file caddy.exe. Hay copy vao thu muc goc.
    exit /b 1
)

:: 2. CAU HINH FILE .ENV (Neu chua co)
if not exist ".env" (
    echo [BUOC 1] KHONG TIM THAY FILE .ENV. DANG KHOI TAO CAU HINH...
    echo.
    set /p DB_SERVER="Nhap IP Database (Mac dinh 127.0.0.1): " || set DB_SERVER=127.0.0.1
    set /p DB_PORT="Nhap Port Database (Mac dinh 2403): " || set DB_PORT=2403
    set /p DB_NAME="Nhap Ten Database: "
    set /p DB_USER="Nhap User DB (sa): " || set DB_USER=sa
    set /p DB_PASS="Nhap Password DB: "
    set /p MY_DOMAIN="Nhap Ten Mien (vi du: dms.tongcongty.com): "
    
    :: Tu dong loai bo http:// hoac https:// neu nguoi dung nhap thua
    set MY_DOMAIN=!MY_DOMAIN:https://=!
    set MY_DOMAIN=!MY_DOMAIN:http://=!
    :: Loai bo dau gach cheo o cuoi neu co
    if "!MY_DOMAIN:~-1!"=="/" set MY_DOMAIN=!MY_DOMAIN:~0,-1!
    
    echo.
    echo [INFO] Dang tao file .env cho domain !MY_DOMAIN!...
    (
        echo DB_USER=!DB_USER!
        echo DB_PASSWORD=!DB_PASS!
        echo DB_SERVER=!DB_SERVER!
        echo DB_PORT=!DB_PORT!
        echo DB_NAME=!DB_NAME!
        echo SESSION_SECRET=dms_report_!random!!random!
        echo NEXTAUTH_SECRET=dms_report_!random!!random!
        echo NEXTAUTH_URL=https://!MY_DOMAIN!
    ) > .env
    echo [OK] Da tao file .env thanh cong.
    echo.
) else (
    echo [OK] Da co file .env. Bo qua buoc cau hinh.
)

:: 3. CAU HINH CADDYFILE (Neu chua co)
if not exist "Caddyfile" (
    echo [BUOC 2] KHONG TIM THAY CADDYFILE. DANG KHOI TAO...
    if "!MY_DOMAIN!"=="" (
        set /p MY_DOMAIN="Nhap lai Ten Mien de cau hinh Caddy (khong ghi https://): "
        set MY_DOMAIN=!MY_DOMAIN:https://=!
        set MY_DOMAIN=!MY_DOMAIN:http://=!
        if "!MY_DOMAIN:~-1!"=="/" set MY_DOMAIN=!MY_DOMAIN:~0,-1!
    )
    (
        echo !MY_DOMAIN! {
        echo     reverse_proxy localhost:3000
        echo }
    ) > Caddyfile
    echo [OK] Da tao Caddyfile cho domain !MY_DOMAIN!.
    echo.
)

:: 4. CAI DAT PM2
call npm list -g pm2 >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Dang cai dat PM2...
    call npm install -g pm2
)

:: 5. DON DEP TOAN BO TRUOC KHI BUILD (Fix loi EBUSY/Locked)
echo.
echo [INFO] Dang don dep: Tat PM2, Caddy va xoa build cu...
call pm2 delete web_v4 >nul 2>&1
call pm2 delete all >nul 2>&1
caddy stop >nul 2>&1

:: Doi 5 giay de Windows giai phong file handle
echo [INFO] Doi 5 giay de he thong giai phong file...
timeout /t 5 /nobreak >nul

:: Cuong ep tat cac tien trinh node dang treo (neu co)
taskkill /f /im node.exe >nul 2>&1

if exist ".next" rmdir /s /q ".next"
echo [OK] Da don dep xong. San sang build moi.

:: 6. BUILD VA TRIEN KHAI
echo [BUOC 3] DANG CAI DAT THU VIEN VA BUILD DU AN...
echo.
call npm install || exit /b 1
echo.
echo [INFO] Dang build Next.js (Standalone mode)...
call npm run build || exit /b 1

:: 7. COPY STATIC ASSETS & ENV (Fix loi mat giao dien va Session)
echo [INFO] Dang chuan bi file giao dien va cau hinh (.env)...
if not exist ".next\standalone\.next\static" mkdir ".next\standalone\.next\static"
xcopy /y /e /s /i ".next\static" ".next\standalone\.next\static" >nul
if not exist ".next\standalone\public" mkdir ".next\standalone\public"
xcopy /y /e /s /i "public" ".next\standalone\public" >nul

:: Copy file .env vao standalone de Next.js tu doc
copy /y ".env" ".next\standalone\.env" >nul

:: 8. CHAY UNG DUNG MOI
echo.
echo [BUOC 4] DANG KHOI CHAY UNG DUNG MOI...
:: Ep dung chung thu muc PM2 voi Administrator de de quan ly
set PM2_HOME=C:\Users\Administrator\.pm2
call pm2 delete web_v4 >nul 2>&1
:: Ep Next.js lang nghe tren tat ca cac IP (0.0.0.0) de truy cap duoc tu ben ngoai
set HOSTNAME=0.0.0.0
set PORT=3000
call pm2 start .next\standalone\server.js --name "web_v4"
call pm2 save

:: 7. CHAY CADDY SERVICE
echo [INFO] Dang kich hoat Caddy...
caddy stop >nul 2>&1
caddy start --config Caddyfile

echo.
echo ======================================================
echo    XONG! WEB CUA ONG DA SAN SANG TAI: https://!MY_DOMAIN!
echo ======================================================
exit /b 0
