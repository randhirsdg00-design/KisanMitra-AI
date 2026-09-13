# KisanMitra AI — Production Agricultural Frontend Platform

**KisanMitra AI** is a professional, accessible, and comprehensive digital agriculture web platform built specifically for Indian farmers. It provides real-time crop disease diagnosis, live Mandi commodity prices, interactive bilingual AI farming advice, farm plot tracking, agricultural scheme discovery, profile management, and application preferences.

---

## Quick Start & Local Execution

### Exact Command to Start the Frontend
From the project root directory, run:

```bash
python server.py
```

*Alternative using Node / npm:*
```bash
npm start
# or
npx serve -l 8080 .
```

### Expected Frontend Port
- **Port:** `8080`
- **Local URL:** `http://127.0.0.1:8080/` (or `http://localhost:8080/`)

### Current Backend API Base URL Configured in Frontend
- **Default Base URL:** `http://127.0.0.1:8080` (served on same origin / relative path)
- **Active Endpoint:** `GET /api/mandi/prices`
- **Configurable via UI:** The Mandi screen includes a live endpoint settings drawer where farmers or developers can point to any custom API URL (saved in `localStorage`).

---

## Project Structure & File Manifest

```
Hackathon/
├── index.html                  # Core single-page application shell (all 11 screens & modals)
├── package.json                # Project metadata & standard npm execution scripts
├── .env.example                # Environment variables template
├── config.example.js           # Runtime frontend configuration template
├── README.md                   # Complete documentation and setup guide
├── server.py                   # Lightweight local dev server with live /api/mandi/prices
│
├── assets/                     # Static assets
│   └── samples/                # High-resolution agricultural leaf sample images
│       ├── tomato_early_blight.jpg
│       ├── wheat_leaf_rust.jpg
│       ├── potato_late_blight.jpg
│       └── healthy_cotton_leaf.jpg
│
├── css/                        # Modular Vanilla CSS architecture (design tokens & components)
│   ├── variables.css           # Color tokens, typography, spacing, shadows, touch targets
│   ├── main.css                # Base reset, layout grid, navigation, header, drawer
│   ├── components.css          # Cards, buttons, tabs, tables, pills, forms, modals, scanner
│   └── chat.css                # AI Mitra chat bubble layouts, input bar, suggestion chips
│
└── js/                         # Modular ES6 controllers & reactive state management
    ├── app.js                  # Main orchestrator, view routing, tabs, navigation bindings
    ├── state.js                # Centralized reactive state store (Pub/Sub pattern)
    ├── data.js                 # Seed data: crops, disease remedies, schemes, mandi baselines
    ├── scanner.js              # Crop scanning engine: camera, upload, dropzone, diagnosis
    ├── mandi.js                # Mandi rates controller: live fetch, filters, search, sorting
    ├── chat.js                 # AI Mitra bilingual conversational agricultural assistant
    ├── farm.js                 # My Farm plot management: add/edit plots, crop distribution
    ├── history.js              # Scan history: filter, view past results, treatment summaries
    ├── schemes.js              # Government schemes discovery: category filters, eligibility
    ├── profile.js              # Farmer profile management: edit modal, bilingual sync
    ├── settings.js             # Preferences: language toggle, light field mode, demo data reset
    └── login.js                # Auth controller: clean mobile/pwd login, Google Identity Services
```

---

## Key Features & Screen Directory

| Screen | DOM Identifier | Description |
| :--- | :--- | :--- |
| **Home** | `#tab-home` | Public landing dashboard with quick actions, weather card, recent activity, and hero scan banner |
| **Login** | `#view-login` | Clean authentication screen: Mobile/Email + Password, show/hide eye toggle, OR divider, Google Sign-In |
| **Crop Scan** | `#tab-scan` | Photo capture, gallery upload, desktop drag & drop, sample leaf chips, and format validation (JPG/PNG < 10MB) |
| **Scan Result** | `#tab-scan-result` | Detailed diagnosis: confidence meter, severity badge, symptoms list, chemical/organic treatments, dosage |
| **Mandi Rates** | `#tab-mandi` | Live agricultural market commodity rates from `/api/mandi/prices` with search, sorting, and state filters |
| **AI Mitra** | `#tab-ai-mitra` | Dedicated conversational agricultural advisor with English/Hindi support, quick chips, and contextual answers |
| **My Farm** | `#tab-farm` | Farm plot tracking: area in acres, soil type, irrigation method, sowing dates, and harvest estimates |
| **History** | `#tab-history` | Archive of past crop scans with search, crop category filters, re-scan shortcuts, and full result recall |
| **Government Schemes**| `#tab-schemes` | Discovery portal for PM-KISAN, PMFBY, Soil Health Card, KCC, and irrigation subsidy programs |
| **Farmer Profile** | `#tab-profile` | Farmer identification card, land summary, state/district information, and edit profile modal |
| **Settings** | `#tab-settings` | Language selector (English/Hindi), Light Field Mode indicator, client-side data explanation, Reset Demo Data |

---

## Authentication & Public Browsing Architecture

1. **Direct Public Startup**:
   - Visitors open directly to the **Home Screen** (`#tab-home`) without being forced to log in.
   - Public features (Home, Mandi Rates, Government Schemes, AI Mitra browsing) are completely accessible.

2. **Scan-Gated Login**:
   - Starting a crop scan while logged out redirects the user to the Login screen with an explanation notice.
   - `state.postLoginRedirect = 'scan'` is saved.

3. **Post-Login Redirection**:
   - Completing login automatically routes the user back to `#tab-scan` with any previously selected sample photo ready.

4. **Google Identity Services (GIS) Web SDK**:
   - Uses the official Google Identity Services library (`https://accounts.google.com/gsi/client`).
   - Strictly avoids deprecated `gapi.auth2`.
   - **Frontend Demo Mode**: In the absence of a Google OAuth Client ID, clicking the Google button displays an honest notice explaining that a Client ID is required, without faking authentication or setting `isAuthenticated = true`.

---

## Environment & Configuration

Copy `.env.example` or `config.example.js` to configure custom endpoints:

```javascript
window.KISAN_CONFIG = {
  BACKEND_BASE_URL: 'http://127.0.0.1:8080',
  MANDI_API_URL: '/api/mandi/prices',
  GOOGLE_CLIENT_ID: 'YOUR_CLIENT_ID.apps.googleusercontent.com', // Optional
  DEFAULT_LANGUAGE: 'en'
};
```

---

## Verification & Testing

The project includes an extensive automated test suite covering all functional modules:

```bash
# Run all 10 module regression test suites
python scratch/run_all_tests.py

# Verify JavaScript syntax balance across all 12 modules
python scratch/check_js_syntax.py

# Verify Authentication & Public Browsing flows
python scratch/test_auth_flow.py

# Verify Google Sign-In & GIS SDK compliance
python scratch/test_google_signin.py

# Verify Settings Screen functionality
python scratch/test_settings_full.py
```

---

## Security & Secrets Policy
- **No Hardcoded Secrets**: This frontend contains no private API keys, database credentials, or secret tokens.
- **Client-Side Safety**: User state and demo session details are managed in-memory and via browser storage (`localStorage`), without sending unauthorized data over the network.
