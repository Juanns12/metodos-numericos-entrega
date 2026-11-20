@echo off
REM ============================================================
REM  Inicia la plataforma de Métodos Numéricos (backend + frontend)
REM  Si Python no está en el PATH, cambie la línea siguiente por la
REM  ruta completa a python.exe, por ejemplo:
REM  set PYTHON=C:\Users\usuario\miniconda3\python.exe
REM ============================================================
set PYTHON=python

cd /d "%~dp0"

echo Instalando dependencias del backend...
%PYTHON% -m pip install -r backend\requirements.txt
if errorlevel 1 (
    echo.
    echo No se pudieron instalar las dependencias. Verifique que Python este instalado.
    pause
    exit /b 1
)

echo Iniciando backend FastAPI en http://127.0.0.1:8000 ...
start "Backend - Metodos Numericos" cmd /k "cd /d "%~dp0backend" && %PYTHON% -m uvicorn main:app --port 8000"

echo Iniciando frontend en http://localhost:5500 ...
start "Frontend - Metodos Numericos" cmd /k "cd /d "%~dp0" && %PYTHON% -m http.server 5500"

timeout /t 4 /nobreak >nul
start "" http://localhost:5500
echo.
echo Listo. Cierre las dos ventanas negras para detener los servidores.
