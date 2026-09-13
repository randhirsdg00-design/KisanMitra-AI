import os
from pathlib import Path
from dotenv import load_dotenv

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file if present
load_dotenv(BASE_DIR / ".env")

APP_ENV = os.getenv("APP_ENV", "development")
APP_HOST = os.getenv("APP_HOST", "127.0.0.1")
APP_PORT = int(os.getenv("APP_PORT", "8001"))

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./kisanmitra.db")

# CORS
raw_cors = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
CORS_ORIGINS = [origin.strip() for origin in raw_cors.split(",") if origin.strip()]

# Google Gemini AI Configuration (Official google-genai SDK)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash").strip()
GEMINI_TIMEOUT_SECONDS = float(os.getenv("GEMINI_TIMEOUT_SECONDS", "30.0"))

# Firebase Admin SDK Configuration (Server-Side Authentication Only)
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "").strip()
FIREBASE_CLIENT_EMAIL = os.getenv("FIREBASE_CLIENT_EMAIL", "").strip()
raw_firebase_private_key = os.getenv("FIREBASE_PRIVATE_KEY", "").strip()
FIREBASE_PRIVATE_KEY = raw_firebase_private_key.replace("\\n", "\n") if raw_firebase_private_key else ""

# OpenWeather API Configuration
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY", "").strip()
WEATHER_API_BASE_URL = os.getenv("WEATHER_API_BASE_URL", "https://api.openweathermap.org/data/2.5").strip()
GEOCODING_API_BASE_URL = os.getenv("GEOCODING_API_BASE_URL", "https://api.openweathermap.org/geo/1.0").strip()
WEATHER_CACHE_TTL_SECONDS = int(os.getenv("WEATHER_CACHE_TTL_SECONDS", "600"))
WEATHER_TIMEOUT_SECONDS = float(os.getenv("WEATHER_TIMEOUT_SECONDS", "10.0"))

# Mandi / Market Price Configuration (data.gov.in / Agmarknet)
MANDI_API_KEY = os.getenv("MANDI_API_KEY", "").strip()
MANDI_API_BASE_URL = os.getenv("MANDI_API_BASE_URL", "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070").strip()
MANDI_DATA_MODE = os.getenv("MANDI_DATA_MODE", "AUTO").strip().upper()  # AUTO, LIVE, or DEMO
MANDI_CACHE_TTL_SECONDS = int(os.getenv("MANDI_CACHE_TTL_SECONDS", "600"))
MANDI_TIMEOUT_SECONDS = float(os.getenv("MANDI_TIMEOUT_SECONDS", "10.0"))


