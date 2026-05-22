#!/usr/bin/env bash
set -e

echo "==> Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
fi

echo "==> Generating app key..."
php artisan key:generate --force

echo "==> Caching config..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "==> Starting server..."
php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
