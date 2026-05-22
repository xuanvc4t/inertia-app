#!/usr/bin/env bash
set -e

echo "==> Installing PHP dependencies..."
composer install --no-dev --optimize-autoloader

echo "==> Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
fi

echo "==> Generating app key..."
php artisan key:generate --force

echo "==> Installing Node dependencies..."
npm ci

echo "==> Building frontend assets..."
npm run build

echo "==> Running migrations..."
php artisan migrate --force

echo "==> Caching config..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "==> Build complete!"
