@echo off
rem Symfony Mindcare Backend Starter
title Symfony Development Server
cd /d "%~dp0"
echo Clearing cache and starting server on localhost:8000...
php bin/console cache:clear --no-warmup
echo.
echo Server starting on http://localhost:8000/
echo Access /dashboard or /login
php -S 127.0.0.1:8000 -t public

