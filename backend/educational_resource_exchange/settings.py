import os
import dj_database_url
from pathlib import Path
import cloudinary
import cloudinary.uploader
import cloudinary.api

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'fallback-secret-key-for-local-dev')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DJANGO_DEBUG', 'False').strip() == 'True'


# Add some debugging output to verify settings (remove after troubleshooting)
print(f"DEBUG mode is: {DEBUG}")

# Dynamically set allowed hosts
ALLOWED_HOSTS = [
    'edushare-backend-okqs.onrender.com',
    'localhost',
    '127.0.0.1',
    os.environ.get('RENDER_EXTERNAL_HOSTNAME', ''),
]

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'cloudinary_storage',  # Must come before django.contrib.staticfiles
    'django.contrib.staticfiles',
    'cloudinary',  # Must come after django.contrib.staticfiles
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'resources',
    'django_extensions',
    'django_filters',
    'whitenoise.runserver_nostatic',
]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],  # Add project templates directory if needed
        'APP_DIRS': True,  # Important: allows admin templates
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Add whitenoise middleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Database Configuration
DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL', 'sqlite:///db.sqlite3'),
        conn_max_age=600
    )
}

ROOT_URLCONF = 'educational_resource_exchange.urls'

# Static files configuration
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# First, set up direct Cloudinary configuration - needs to be before CLOUDINARY_STORAGE
cloudinary.config( 
    cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME'),
    api_key = os.environ.get('CLOUDINARY_API_KEY'),
    api_secret = os.environ.get('CLOUDINARY_API_SECRET'),
    secure = True
)

# Then configure Django-Cloudinary-Storage
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.environ.get('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': os.environ.get('CLOUDINARY_API_KEY'),
    'API_SECRET': os.environ.get('CLOUDINARY_API_SECRET'),
    'SECURE': True,
    'RESOURCE_TYPES': ['image', 'video', 'raw'],
    'MEDIA_ATTRIBUTE_NAME': 'file',
    'DEFAULT_RESOURCE_TYPE': 'raw',  # Treat uploads as raw files by default
    'INVALID_VIDEO_ERROR_MESSAGE': 'Please upload a valid file.',
    'UNSIGNED': True  # Makes uploads publicly accessible
}

# Print cloudinary config values for debugging (without secrets)
print(f"CLOUDINARY_CLOUD_NAME: {os.environ.get('CLOUDINARY_CLOUD_NAME', 'Not set')}")
print(f"CLOUDINARY_API_KEY set: {'Yes' if os.environ.get('CLOUDINARY_API_KEY') else 'No'}")
print(f"CLOUDINARY_API_SECRET set: {'Yes' if os.environ.get('CLOUDINARY_API_SECRET') else 'No'}")

# Set default file storage to Cloudinary in production
# We'll always use Cloudinary in production for more reliability
DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
print("Using Cloudinary storage for media files")

# Static files can use different storage based on environment
if not DEBUG:
    # Use Cloudinary for static files in production
    STATICFILES_STORAGE = 'cloudinary_storage.storage.StaticHashedCloudinaryStorage'
else:
    # Use WhiteNoise for static files in development
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

CORS_ALLOWED_ORIGINS = [
    'https://v0-educational-resource-platform.vercel.app',
    'http://localhost:3000',
]

# Additional CORS settings
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Don't force SSL in development
if not DEBUG:
    # Security Enhancements for production only
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
else:
    # Disable security redirects locally
    SECURE_SSL_REDIRECT = False
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False

# Logging Configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',  # Changed from WARNING to INFO for more visibility
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'cloudinary': {  # Add specific logging for Cloudinary
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# Rest of your existing configurations remain the same
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': None,
    'PAGE_SIZE': 10,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
    ],
}

AUTH_USER_MODEL = 'resources.User'