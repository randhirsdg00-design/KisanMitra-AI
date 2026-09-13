/**
 * KisanMitra AI — Runtime Frontend Configuration Template
 * 
 * To customize your local or production environment:
 * 1. Copy this file to 'config.js' (or load before app.js)
 * 2. Set your Google OAuth 2.0 Web Client ID (if integrating Google Sign-In)
 * 3. Set your custom Mandi API endpoint if pointing to an external microservice
 */

window.KISAN_CONFIG = {
  // Backend API Base URL
  // Default: '' (relative to current domain) or 'http://127.0.0.1:8080'
  BACKEND_BASE_URL: 'http://127.0.0.1:8080',

  // Mandi Prices API endpoint path or absolute URL
  // Default: '/api/mandi/prices'
  MANDI_API_URL: '/api/mandi/prices',

  // Optional Google OAuth 2.0 Client ID for Google Identity Services (GIS)
  // Format: 'YOUR_CLIENT_ID.apps.googleusercontent.com'
  // Leave null or empty to run in honest frontend-demo mode
  GOOGLE_CLIENT_ID: null,

  // Default Language: 'en' | 'hi'
  DEFAULT_LANGUAGE: 'en'
};
