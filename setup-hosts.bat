@echo off
:: Script ini harus dijalankan sebagai Administrator
:: Menambahkan entry custom DNS ke Windows hosts file

echo Menambahkan custom DNS entries ke hosts file...
echo.

set HOSTS_FILE=C:\Windows\System32\drivers\etc\hosts

:: Cek apakah sudah ada
findstr /C:"siam.local" "%HOSTS_FILE%" >nul 2>&1
if %errorlevel% neq 0 (
    echo 127.0.0.1  siam.local >> "%HOSTS_FILE%"
    echo [OK] siam.local ditambahkan
) else (
    echo [SKIP] siam.local sudah ada
)

findstr /C:"minio.local" "%HOSTS_FILE%" >nul 2>&1
if %errorlevel% neq 0 (
    echo 127.0.0.1  minio.local >> "%HOSTS_FILE%"
    echo [OK] minio.local ditambahkan
) else (
    echo [SKIP] minio.local sudah ada
)

findstr /C:"db.local" "%HOSTS_FILE%" >nul 2>&1
if %errorlevel% neq 0 (
    echo 127.0.0.1  db.local >> "%HOSTS_FILE%"
    echo [OK] db.local ditambahkan
) else (
    echo [SKIP] db.local sudah ada
)

echo.
echo === Isi hosts file (entri custom): ===
findstr /C:"siam.local" /C:"minio.local" /C:"db.local" "%HOSTS_FILE%"

echo.
echo Selesai! Buka browser dan akses:
echo   http://siam.local   (aplikasi web)
echo   http://minio.local  (MinIO console)
echo   http://db.local     (phpMyAdmin)
echo.
pause
