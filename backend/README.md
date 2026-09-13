# KisanMitra AI — Backend Service

## 1. What the Backend Does
The KisanMitra AI Backend provides the foundational REST API services for the KisanMitra platform, designed to assist farmers with AI-driven insights, crop health diagnostics, market information, and farming recommendations. It features:
- **Modular FastAPI Application Architecture**
- **SQLite + SQLAlchemy 2.x ORM Database Layer** with models for Users, Farms, Scan History, Saved Advice, Reminders, and Notification Preferences
- **Real Google Gemini AI Integration** using the official `google-genai` SDK with agricultural safety guidelines, multi-lingual support, farm personalization, and conversation history
- **Firebase Authentication Backend Foundation** using official `firebase-admin` SDK with cryptographically verified ID tokens, Bearer token extraction, and graceful degradation
- **Real Weather & Geocoding Service** powered by OpenWeather API with reverse geocoding, metric conversions (Celsius, km/h, mm), resilient fallback, and short-lived caching
- **Mandi / Market Price Service** with clean provider abstraction (LIVE data.gov.in / Agmarknet vs. DEMO curated sample data), query filtering, and caching
- **CORS Support** for the local frontend development server (`http://localhost:3000`)
- **Structured Error Handling** with sanitized JSON error payloads
- **Comprehensive Pytest Test Suite** (67/67 tests passing: CRUD, AI, Auth, Weather, and Mandi)

## 2. Python Version
- **Python 3.10+** (Tested on Python 3.10.11)

## 3. Virtual Environment Setup

From the project root:

```bash
# Windows (PowerShell / CMD)
python -m venv backend/venv

# Linux / macOS
python3 -m venv backend/venv
```

Activate the virtual environment:

```bash
# Windows (PowerShell)
.\backend\venv\Scripts\Activate.ps1

# Windows (CMD)
.\backend\venv\Scripts\activate.bat

# Linux / macOS
source backend/venv/bin/activate
```

## 4. Dependency Installation

Install backend dependencies:

```bash
# Windows
.\backend\venv\Scripts\pip install -r backend/requirements.txt

# Linux / macOS
./backend/venv/bin/pip install -r backend/requirements.txt
```

Key dependencies:
- `fastapi`, `uvicorn[standard]`, `pydantic`, `python-dotenv`
- `sqlalchemy`
- `google-genai` (Official Google Gemini SDK)
- `firebase-admin` (Official Firebase Admin SDK)
- `pytest`, `httpx` (Testing)

## 5. Environment Configuration (.env)

Copy the environment template:

```bash
cp backend/.env.example backend/.env
```

Configure the environment variables in `backend/.env`:

```env
APP_ENV=development
APP_HOST=127.0.0.1
APP_PORT=8001

# Database Configuration (SQLite default)
DATABASE_URL=sqlite:///./kisanmitra.db

# Frontend CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Google Gemini AI Integration
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TIMEOUT_SECONDS=30.0

# Firebase Admin SDK Configuration (Server-Side Only)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

> [!CAUTION]
> Never commit `backend/.env` or expose your `GEMINI_API_KEY`. It is loaded server-side only.

## 6. How to Run FastAPI

From the project root directory, run:

```bash
# Windows (PowerShell / CMD)
.\backend\venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --port 8001

# Linux / macOS
./backend/venv/bin/python -m uvicorn backend.app.main:app --reload --port 8001
```

> [!TIP]
> On Windows, running via `python.exe -m uvicorn ...` instead of `uvicorn.exe` avoids Windows Defender / Application Control policy blocks on generated wrapper executables in user directories.

## 7. Google Gemini AI Assistant Integration

### Endpoints:
- `GET /api/assistant/status` — Checks if Gemini is configured and ready (never exposes the key).
- `POST /api/assistant/chat` — Generates context-aware agricultural advisory responses.

### Supported Languages (13 Indian Languages):
- Hindi (`hi` / `hi-IN`)
- English (`en` / `en-IN`)
- Bhojpuri (`bho` / `hi-IN`)
- Punjabi (`pa` / `pa-IN`)
- Gujarati (`gu` / `gu-IN`)
- Bengali (`bn` / `bn-IN`)
- Marathi (`mr` / `mr-IN`)
- Tamil (`ta` / `ta-IN`)
- Telugu (`te` / `te-IN`)
- Kannada (`kn` / `kn-IN`)
- Malayalam (`ml` / `ml-IN`)
- Odia (`or` / `od-IN`)
- Urdu (`ur` / `ur-IN`)

Automatic script detection (`auto_detect: true`) resolves the farmer's script and language dynamically, while `conversation_language` can force a specific language.

### Request Example:
```bash
POST http://127.0.0.1:8001/api/assistant/chat
Content-Type: application/json

{
  "message": "When should I irrigate my crop?",
  "auto_detect": true,
  "farm_context": {
    "farm_name": "Sunrise Farm",
    "crop": "Cotton",
    "area": 5.0,
    "soil_type": "Black soil",
    "irrigation_type": "Drip",
    "location": "Rajkot, Gujarat"
  },
  "conversation_history": [
    {"role": "user", "content": "I have planted cotton this month."},
    {"role": "assistant", "content": "Cotton in black soil requires careful moisture control."}
  ]
}
```

### Success Response Example:
```json
{
  "success": true,
  "reply": "For your 5-acre cotton farm with black soil in Rajkot, apply drip irrigation every 4-5 days depending on soil moisture. Avoid waterlogging as black soil retains moisture.",
  "mode": "ONLINE_AI",
  "engine": "Gemini",
  "provider": "Gemini",
  "language": "English",
  "tts_language": "en-IN",
  "detected_language": "English",
  "model_info": "gemini-2.5-flash",
  "error": null
}
```

### Unconfigured / Error Behavior:
If `GEMINI_API_KEY` is not present or an upstream timeout/API outage occurs, the API returns a structured, honest error without hallucinating fake answers:
```json
{
  "success": false,
  "reply": null,
  "mode": "ERROR",
  "engine": "Gemini",
  "provider": "Gemini",
  "language": "English",
  "tts_language": "en-IN",
  "detected_language": "English",
  "model_info": "gemini-2.5-flash",
  "error": "AI service temporarily unavailable (API key not configured)."
}
```

## 8. Firebase Authentication Backend Foundation

The backend provides a secure, server-side authentication layer powered by the official `firebase-admin` SDK.

### Architecture Highlights:
- **Server-Side Only**: Firebase Admin credentials remain strictly within `backend/.env` (or environment variables). Never exposed in frontend, git, or client payloads.
- **Cryptographic Token Verification**: The `get_current_firebase_user` dependency parses `Authorization: Bearer <token>` and verifies the JWT cryptographically via Firebase's public keys. It extracts the caller's verified `uid`, `email`, and claims without trusting client-supplied identifiers.
- **Graceful Degradation**: If Firebase credentials are not yet configured in `.env`, the server starts cleanly without crashing:
  - `GET /api/auth/status` reports `{"firebase_auth_configured": false, "provider": "Firebase"}`.
  - Protected endpoints return a clean 401 Unauthorized (`"Authentication service is currently unconfigured."`).

### Authentication Endpoints:
- `GET /api/auth/status` — Reports Firebase Admin SDK configuration readiness.
- `GET /api/auth/me` — Protected endpoint returning verified caller profile (`uid`, `email`, `name`). Requires `Authorization: Bearer <id_token>`.

### Protected Endpoint Example:
```bash
curl -X GET http://127.0.0.1:8001/api/auth/me \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>"
```

Response:
```json
{
  "authenticated": true,
  "uid": "aB1cD2eF3gH4",
  "email": "farmer@kisanmitra.ai",
  "name": "Kisan Mitra"
}
```

## 9. Real Weather & Geocoding Service

The backend integrates with OpenWeather API to provide real-time hyper-local atmospheric conditions and reverse geocoding for farm coordinates.

### Architecture Highlights:
- **No Hardcoded Cities**: Coordinates are provided dynamically by the client (e.g. browser GPS). The backend never assumes, guesses, or hardcodes locations.
- **Reverse Geocoding with Graceful Fallback**: Resolves town/city, state, and country via OpenWeather's geocoding API. If geocoding fails or is empty, weather data is still returned with fallback location metadata.
- **Metric Unit Standard**:
  - Temperature: Celsius (°C)
  - Feels Like: Celsius (°C)
  - Wind Speed: Converted from m/s to kilometers per hour (`km/h = round(mps * 3.6, 1)`)
  - Rain: Millimeters (`mm` from `1h` or `3h` precipitation accumulation)
  - Humidity: Percentage (`%`, 0-100)
- **Short-Lived Caching**: In-memory cache keyed on coordinates rounded to 3 decimal places (`~110m` precision) and language with a 10-minute TTL (`WEATHER_CACHE_TTL_SECONDS=600`). Prevents API quota exhaustion and avoids redundant network calls.
- **Sanitized Errors**: API keys and raw upstream errors are never leaked to clients.

### Endpoint:
`GET /api/weather/current`

#### Query Parameters:
| Parameter | Type | Required | Description |
|---|---|---|---|
| `latitude` | float | Yes | Latitude between `-90.0` and `90.0` |
| `longitude` | float | Yes | Longitude between `-180.0` and `180.0` |
| `language` | string | No | Optional language code for descriptions (e.g. `hi`, `en`) |

#### Example Request:
```bash
GET http://127.0.0.1:8001/api/weather/current?latitude=28.6139&longitude=77.2090
```

#### Success Response:
```json
{
  "success": true,
  "location": {
    "name": "New Delhi",
    "state": "Delhi",
    "country": "IN",
    "latitude": 28.6139,
    "longitude": 77.209
  },
  "weather": {
    "temperature": 30.5,
    "feels_like": 32.1,
    "condition": "Clear",
    "description": "Clear sky",
    "humidity": 45,
    "wind_speed": 18.0,
    "rain": 1.25
  },
  "provider": "OpenWeather",
  "cached": false
}
```

#### Error Responses:
- **Missing API Key (503 Service Unavailable)**:
  ```json
  {
    "success": false,
    "error": "weather_unconfigured",
    "message": "Weather service is unconfigured. WEATHER_API_KEY is missing."
  }
  ```
- **Invalid Coordinates (400 Bad Request)**:
  ```json
  {
    "success": false,
    "error": "invalid_coordinates",
    "message": "Coordinates out of range: latitude (95.0) must be in [-90, 90] and longitude (77.2) must be in [-180, 180]."
  }
  ```
- **Rate Limit Exceeded (429 Too Many Requests)**:
  ```json
  {
    "success": false,
    "error": "weather_rate_limit",
    "message": "Weather service rate limit exceeded. Please try again later."
  }
  ```

## 10. Mandi / Market Price Service

The backend provides APMC market price discovery for agricultural commodities across India with a modular provider abstraction.

### Architecture Highlights:
- **LIVE vs. DEMO Transparency**: Responses explicitly declare `"data_mode": "LIVE"` (when connected to data.gov.in / Agmarknet API) or `"data_mode": "DEMO"` (curated realistic sample market data). Sample data is never presented as live prices.
- **Provider Abstraction (`MandiProviderBase`)**:
  - `LiveMandiProvider`: Connects to `data.gov.in` Agmarknet API when `MANDI_API_KEY` is provided.
  - `DemoMandiProvider`: Default zero-credential provider pre-seeded with realistic market prices for 10+ crops across Bihar, UP, Punjab, MP, and Maharashtra.
- **Filtering & Search**: Case-insensitive partial and exact matching on:
  - `commodity` (e.g. Wheat, Rice, Potato, Tomato, Onion)
  - `state` (e.g. Bihar, Uttar Pradesh, Punjab)
  - `district` (e.g. Patna, Varanasi, Gaya)
  - `market` (e.g. Patna, Muzaffarpur, Kanpur)
- **Standardized Pricing**: Prices reported in Indian Rupees (INR ₹) per quintal (`unit: "quintal"`), including `min_price`, `max_price`, and `modal_price` (benchmark prevailing trading rate).
- **Short-Lived Caching**: 10-minute in-memory cache (`MANDI_CACHE_TTL_SECONDS=600`) keyed on query parameters.

### Endpoint:
`GET /api/mandi/prices`

#### Query Parameters:
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `commodity` | string | No | None | Filter by crop/commodity name |
| `state` | string | No | None | Filter by state |
| `district` | string | No | None | Filter by district |
| `market` | string | No | None | Filter by mandi/market yard |
| `limit` | integer | No | 50 | Max records to return (1 to 200) |

#### Example Request:
```bash
GET http://127.0.0.1:8001/api/mandi/prices?commodity=Wheat&state=Bihar
```

#### Success Response:
```json
{
  "success": true,
  "data_mode": "DEMO",
  "provider": "Demo Market Provider (Sample Data)",
  "last_updated": "2026-09-13T10:17:56Z",
  "total_records": 1,
  "prices": [
    {
      "commodity": "Wheat",
      "market": "Patna",
      "district": "Patna",
      "state": "Bihar",
      "min_price": 2150.0,
      "max_price": 2320.0,
      "modal_price": 2240.0,
      "unit": "quintal",
      "date": "2026-09-13"
    }
  ],
  "cached": false
}
```

## 11. Health and Documentation Endpoints
- Health Check: [http://127.0.0.1:8001/health](http://127.0.0.1:8001/health)
- Mandi Prices: [http://127.0.0.1:8001/api/mandi/prices](http://127.0.0.1:8001/api/mandi/prices)
- Weather Current: [http://127.0.0.1:8001/api/weather/current](http://127.0.0.1:8001/api/weather/current)
- Auth Status: [http://127.0.0.1:8001/api/auth/status](http://127.0.0.1:8001/api/auth/status)
- AI Status: [http://127.0.0.1:8001/api/assistant/status](http://127.0.0.1:8001/api/assistant/status)
- Swagger UI: [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)
- ReDoc: [http://127.0.0.1:8001/redoc](http://127.0.0.1:8001/redoc)

## 12. Running Tests

Run the complete automated test suite:

```bash
# Windows
.\backend\venv\Scripts\python.exe -m pytest -v

# Linux / macOS
./backend/venv/bin/python -m pytest -v
```

All 67 automated tests run with full isolation, in-memory SQLite database, and 100% mocked AI, Firebase, Weather & Mandi credentials:
- `test_api.py` (12 tests): Database schema, relationships, cascades, and domain CRUD endpoints.
- `test_assistant.py` (12 tests): Gemini AI advisory, multilingual prompts, context injection, and error fallbacks.
- `test_firebase_auth.py` (12 tests): Token parsing, expiration, invalid tokens, unconfigured states, and user resolution.
- `test_weather.py` (15 tests): Coordinate bounds, missing key, mocked OpenWeather API, 401, 429, 5xx, timeouts, geocoding fallback, unit conversions (m/s to km/h), and short-lived caching.
- `test_mandi.py` (16 tests): Demo provider, live provider mock, filters (commodity, state, district, market), limit bounds validation (1-200), empty results, upstream errors (timeout, 500, malformed), data_mode transparency, and caching.

## 13. Project Structure

```
backend/
├── app/
│   ├── __init__.py             # Application package marker
│   ├── config.py               # Environment configuration loader
│   ├── main.py                 # FastAPI app instance, CORS, error handling, health
│   ├── core/
│   │   ├── __init__.py         # Core package marker
│   │   ├── dependencies.py     # Dev user resolver & Firebase auth dependencies
│   │   └── exceptions.py       # Custom structured error classes
│   ├── database/
│   │   ├── __init__.py         # Database exports
│   │   ├── models.py           # SQLAlchemy 2.0 models (User, Farm, ScanHistory, etc.)
│   │   └── session.py          # Session management & init_db()
│   ├── routes/
│   │   ├── __init__.py         # API router aggregator (/api)
│   │   ├── advice.py           # Saved advice endpoints
│   │   ├── assistant.py        # Gemini AI Assistant (/chat, /status)
│   │   ├── auth.py             # Firebase Auth endpoints (/status, /me)
│   │   ├── farms.py            # Farm CRUD endpoints
│   │   ├── history.py          # Crop scan diagnosis history endpoints
│   │   ├── mandi.py            # Mandi / Market price endpoints (/prices)
│   │   ├── notifications.py    # Notification preferences endpoints
│   │   ├── reminders.py        # Farming calendar reminder endpoints
│   │   └── weather.py          # Weather & Geocoding endpoints (/current)
│   ├── schemas/
│   │   ├── __init__.py         # Schemas exports
│   │   ├── advice.py           # Saved advice Pydantic schemas
│   │   ├── assistant.py        # AI Chat & Status Pydantic schemas
│   │   ├── auth.py             # Authentication Pydantic schemas
│   │   ├── common.py           # ErrorResponse & SuccessResponse schemas
│   │   ├── farm.py             # Farm Pydantic schemas
│   │   ├── history.py          # Scan history Pydantic schemas
│   │   ├── mandi.py            # Mandi price Pydantic schemas
│   │   ├── notification.py     # Notification preferences schemas
│   │   ├── reminder.py         # Reminder Pydantic schemas
│   │   ├── user.py             # User Pydantic schemas
│   │   └── weather.py          # Weather & Geocoding Pydantic schemas
│   └── services/
│       ├── __init__.py         # Services package marker
│       ├── firebase_auth.py    # Firebase Admin SDK service (Singleton, token verification)
│       ├── gemini_service.py   # Gemini AI Service (Singleton, safety prompts, language detection)
│       ├── mandi_service.py    # Mandi Price Service (Singleton, Live & Demo providers, caching)
│       └── weather_service.py  # Weather & Geocoding Service (Singleton, OpenWeather, caching)
├── tests/
│   ├── __init__.py             # Tests package marker
│   ├── conftest.py             # Pytest fixtures & in-memory test DB
│   ├── test_api.py             # Database & domain CRUD tests (12 tests)
│   ├── test_assistant.py       # Gemini AI assistant unit tests (12 tests)
│   ├── test_firebase_auth.py   # Firebase auth unit & integration tests (12 tests)
│   ├── test_mandi.py           # Mandi market price unit & integration tests (16 tests)
│   └── test_weather.py         # Weather & geocoding unit & integration tests (15 tests)
├── venv/                       # Local Python virtual environment (ignored in git)
├── .env.example                # Example environment variables template
├── .env                        # Local development environment (ignored in git)
├── requirements.txt            # Project dependencies
└── README.md                   # Complete backend documentation
```
