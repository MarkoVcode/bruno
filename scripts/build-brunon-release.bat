@echo off
setlocal enabledelayedexpansion

REM BrunoN release build script for Windows
REM Simplified version that uses .env for configuration

set PLATFORM=%1

if "%PLATFORM%"=="" (
  echo Usage: %0 ^<platform^>
  echo Platforms: linux, mac, win, deb, rpm, snap
  exit /b 1
)

echo Building BrunoN release for platform: %PLATFORM%

REM Get version from git tag if available and export as environment variable
git describe --tags --exact-match >nul 2>&1
if %errorlevel% equ 0 (
  for /f "tokens=*" %%i in ('git describe --tags --exact-match') do set BRUNON_VERSION=%%i
  echo Using git tag version: !BRUNON_VERSION!
) else (
  echo Using default version from .env or package.json
)

REM Step 1: Build required packages
echo Building required packages...
call npm run build:openapi-docs
if %errorlevel% neq 0 exit /b %errorlevel%

REM Step 2: Build web application
echo Building web application...
call npm run build:web
if %errorlevel% neq 0 exit /b %errorlevel%

REM Step 3: Prepare Electron web assets
echo Preparing Electron web assets...

REM Remove old web directory (not out\ to preserve artifacts from other platforms)
if exist packages\bruno-electron\web rmdir /s /q packages\bruno-electron\web

REM Copy web build
xcopy /s /e /i packages\bruno-app\dist packages\bruno-electron\web

REM Remove sourcemaps (optional, reduces size)
for /r packages\bruno-electron\web %%f in (*.map) do del "%%f"

echo Web assets prepared

REM Step 4: Build Electron distributables
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
