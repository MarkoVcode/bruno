@echo off
setlocal enabledelayedexpansion

REM BrunoN release build script for Windows
REM This script applies BrunoN branding and builds release packages
REM Only run during release builds to minimize code changes

set PLATFORM=%1

if "%PLATFORM%"=="" (
  echo Usage: %0 ^<platform^>
  echo Platforms: linux, mac, win, deb, rpm, snap
  exit /b 1
)

echo Building BrunoN release for platform: %PLATFORM%

REM Set BrunoN release environment variables
set BRUNON_RELEASE=true

REM Get version from git tag if available
git describe --tags --exact-match >nul 2>&1
if %errorlevel% equ 0 (
  for /f "tokens=*" %%i in ('git describe --tags --exact-match') do set BRUNON_GIT_TAG=%%i
  echo Using git tag version: !BRUNON_GIT_TAG!
) else (
  echo Warning: Not on a tagged commit. Version will use package.json value only.
)

REM Step 1: Build required packages
echo Building required packages...
call npm run build:openapi-docs
if %errorlevel% neq 0 exit /b %errorlevel%

REM Step 2: Apply BrunoN branding to UI files
echo Applying BrunoN branding...
node scripts/apply-brunon-branding.js
if %errorlevel% neq 0 exit /b %errorlevel%

REM Step 3: Build web application
echo Building web application...
call npm run build:web
if %errorlevel% neq 0 exit /b %errorlevel%

REM Step 4: Prepare Electron web assets
echo Preparing Electron web assets...

REM Remove old build directories
if exist packages\bruno-electron\out rmdir /s /q packages\bruno-electron\out
if exist packages\bruno-electron\web rmdir /s /q packages\bruno-electron\web

REM Create new web directory
mkdir packages\bruno-electron\web

REM Copy web build
xcopy /s /e /i packages\bruno-app\dist packages\bruno-electron\web

REM Update static paths for Electron using PowerShell
powershell -Command "Get-ChildItem packages\bruno-electron\web -Filter *.html -Recurse | ForEach-Object { (Get-Content $_.FullName) -replace '/static/', 'static/' | Set-Content $_.FullName }"
powershell -Command "Get-ChildItem packages\bruno-electron\web\static\css -Filter *.css -Recurse | ForEach-Object { (Get-Content $_.FullName) -replace '/static/font', '../../static/font' | Set-Content $_.FullName }"

REM Remove sourcemaps
for /r packages\bruno-electron\web %%f in (*.map) do del "%%f"

echo Web assets prepared

REM Step 5: Build Electron distributables
echo Building Electron package for %PLATFORM%...

if "%PLATFORM%"=="snap" (
  call npm run dist:snap --workspace=packages/bruno-electron
) else if "%PLATFORM%"=="mac" (
  call npm run dist:mac --workspace=packages/bruno-electron
) else if "%PLATFORM%"=="win" (
  call npm run dist:win --workspace=packages/bruno-electron
) else if "%PLATFORM%"=="deb" (
  call npm run dist:deb --workspace=packages/bruno-electron
) else if "%PLATFORM%"=="rpm" (
  call npm run dist:rpm --workspace=packages/bruno-electron
) else if "%PLATFORM%"=="linux" (
  call npm run dist:linux --workspace=packages/bruno-electron
) else (
  echo Unknown platform: %PLATFORM%
  echo Valid platforms: linux, mac, win, deb, rpm, snap
  exit /b 1
)

if %errorlevel% neq 0 exit /b %errorlevel%

echo.
echo ✓ BrunoN release build complete!
echo   Platform: %PLATFORM%
echo   Output: packages\bruno-electron\out\
