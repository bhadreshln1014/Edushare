#!/usr/bin/env bash
# exit on error
set -o errexit

# Python setup
python -m pip install --upgrade pip
pip install -r requirements.txt

# Database migrations
python manage.py collectstatic --no-input
python manage.py migrate