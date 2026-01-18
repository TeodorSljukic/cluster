@echo off
REM Batch script za Git setup (alternativa za PowerShell)
echo.
echo ========================================
echo Git Setup za ABGC Next.js projekat
echo ========================================
echo.

REM Proveri da li je Git instaliran
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git nije instaliran!
    echo Molimo instalirajte Git sa: https://git-scm.com/download/win
    echo Nakon instalacije, restartujte Command Prompt i pokrenite ovu skriptu ponovo.
    pause
    exit /b 1
)

echo [OK] Git je instaliran
echo.

REM Prebaci se u nextjs folder
cd /d "%~dp0"

REM Proveri da li je Git već inicijalizovan
if exist ".git" (
    echo [OK] Git repozitorijum već postoji
) else (
    echo [INFO] Inicijalizujem Git repozitorijum...
    git init
    echo [OK] Git repozitorijum inicijalizovan
)

echo.
echo [INFO] Proveravam status...
git status

echo.
echo [INFO] Dodajem fajlove...
git add .

echo.
echo [INFO] Pravim commit...
git commit -m "Initial commit - Next.js ABGC project with CMS, Chat, Profile, and i18n support"

echo.
echo [OK] Commit kreiran!
echo.
echo ========================================
echo Sledeći koraci:
echo ========================================
echo 1. Idite na https://github.com i kreirajte novi repozitorijum
echo 2. Kopirajte URL repozitorijuma
echo 3. Pokrenite sledeće komande:
echo.
echo    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo ========================================
pause
