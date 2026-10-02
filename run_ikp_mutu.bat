@echo off
title IKP Mutu - Starter Control Panel
color 0B
echo =======================================================================
echo               MEMULAI APLIKASI IKP MUTU (RS AIRAN RAYA)
echo =======================================================================
echo.

:: 1. Menjalankan Backend Django (Port 8009)
echo [-] Menjalankan Backend Django di port 8009...
start "Backend Django (Port 8009)" cmd /k "cd /d "%~dp0" && call .venv\Scripts\activate.bat && py manage.py runserver 0.0.0.0:8009"

:: 2. Menjalankan WhatsApp Service (Port 8010)
echo [-] Menjalankan WhatsApp Integration Service di port 8010...
start "WhatsApp Service" cmd /k "cd /d "%~dp0services\whatsapp" && node server.js"

:: 3. Menjalankan Frontend React
echo [-] Menjalankan Frontend React (ikp-mutu-react)...
start "Frontend React" cmd /k "cd /d "%~dp0frontend\ikp-mutu-react" && npm run dev --host"

echo.
echo =======================================================================
echo  Semua service telah dijalankan di jendela cmd terpisah.
echo  Silakan periksa setiap jendela CMD untuk memastikan tidak ada error.
echo  Jangan tutup jendela-jendela tersebut selama aplikasi digunakan.
echo =======================================================================
echo.
pause
