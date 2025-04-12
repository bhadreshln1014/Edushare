#!/usr/bin/env bash
# exit on error
set -o errexit

# Python setup
python -m pip install --upgrade pip
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --no-input

# Run database migrations
python manage.py migrate

# Optional: run system checks
python manage.py check