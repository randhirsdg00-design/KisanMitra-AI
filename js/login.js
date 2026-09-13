/* =========================================================
   KisanMitra AI — Login Page Controller
   Clean, Accessible, Professional Agricultural Login Flow
   ========================================================= */

import { state } from './state.js';

export class LoginManager {
  constructor() {
    this.view = document.getElementById('view-login');
    this.form = document.getElementById('form-login');
    this.identifierInput = document.getElementById('login-identifier');
    this.passwordInput = document.getElementById('login-password');
    this.togglePwdBtn = document.getElementById('btn-toggle-pwd');
    this.identifierError = document.getElementById('identifier-error-msg');
    this.passwordError = document.getElementById('password-error-msg');
    this.alertBanner = document.getElementById('login-alert-banner');
    this.alertText = document.getElementById('login-alert-text');
    this.demoFillBtn = document.getElementById('btn-demo-fill');
    this.forgotPwdBtn = document.getElementById('btn-forgot-password');
    this.createAccountBtn = document.getElementById('btn-create-account');
    this.googleWrap = document.getElementById('google-auth-wrap');
    this.googleBtn = document.getElementById('btn-google-signin');
    this.googleNotice = document.getElementById('google-notice-text');
    this.googleMount = document.getElementById('g_id_signin_mount');

    this.init();
  }

  init() {
    this.bindEvents();
    this.initGoogleAuth();

    state.subscribe((event, payload) => {
      if (event === 'viewChange' && payload === 'login') {
        if (state.loginNotice) {
          this.showAlert(state.loginNotice, 'info');
        } else {
          this.hideAlert();
        }
        if (this.googleNotice) {
          this.googleNotice.style.display = 'none';
        }
        if (this.identifierInput) {
          setTimeout(() => this.identifierInput.focus(), 50);
        }
      }
    });
  }

  bindEvents() {
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    // Password visibility toggle
    if (this.togglePwdBtn && this.passwordInput) {
      this.togglePwdBtn.addEventListener('click', () => {
        const isPassword = this.passwordInput.type === 'password';
        this.passwordInput.type = isPassword ? 'text' : 'password';
        this.togglePwdBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
        this.togglePwdBtn.setAttribute('title', isPassword ? 'Hide password' : 'Show password');
        
        const openIcon = this.togglePwdBtn.querySelector('.eye-open');
        const closedIcon = this.togglePwdBtn.querySelector('.eye-closed');
        if (openIcon && closedIcon) {
          openIcon.style.display = isPassword ? 'none' : 'block';
          closedIcon.style.display = isPassword ? 'block' : 'none';
        }
      });
    }

    // Live clear errors on user typing
    if (this.identifierInput) {
      this.identifierInput.addEventListener('input', () => {
        this.clearFieldError(this.identifierInput, this.identifierError);
        this.hideAlert();
      });
    }

    if (this.passwordInput) {
      this.passwordInput.addEventListener('input', () => {
        this.clearFieldError(this.passwordInput, this.passwordError);
        this.hideAlert();
      });
    }

    // Demo Auto-fill Helper for effortless testing
    if (this.demoFillBtn) {
      this.demoFillBtn.addEventListener('click', () => {
        if (this.identifierInput) this.identifierInput.value = '9876543210';
        if (this.passwordInput) this.passwordInput.value = 'kisan123';
        this.clearAllErrors();
        if (this.identifierInput) this.identifierInput.focus();
      });
    }

    // Forgot password demo notice
    if (this.forgotPwdBtn) {
      this.forgotPwdBtn.addEventListener('click', () => {
        this.showAlert('Demo mode: An OTP reset link has been simulated for your registered mobile number.', 'info');
      });
    }

    // Create account demo notice
    if (this.createAccountBtn) {
      this.createAccountBtn.addEventListener('click', () => {
        this.showAlert('Demo mode: New farmer registration will connect to the state portal. Use any credentials to demo login.', 'info');
      });
    }
  }

  handleLogin() {
    this.clearAllErrors();
    let hasError = false;
    let firstErrorField = null;

    const identifierVal = this.identifierInput ? this.identifierInput.value.trim() : '';
    const passwordVal = this.passwordInput ? this.passwordInput.value.trim() : '';

    // 1. Validate Mobile Number or Email
    if (!identifierVal) {
      this.setFieldError(
        this.identifierInput, 
        this.identifierError, 
        'Please enter your mobile number or email address.'
      );
      hasError = true;
      if (!firstErrorField) firstErrorField = this.identifierInput;
    } else if (identifierVal.includes('@')) {
      // Validate Email Format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifierVal)) {
        this.setFieldError(
          this.identifierInput, 
          this.identifierError, 
          'Please enter a valid email format (e.g. farmer@example.com).'
        );
        hasError = true;
        if (!firstErrorField) firstErrorField = this.identifierInput;
      }
    } else {
      // Validate Mobile format if numerical
      const digitsOnly = identifierVal.replace(/[\s-]/g, '');
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(digitsOnly)) {
        this.setFieldError(
          this.identifierInput, 
          this.identifierError, 
          'Please enter a valid 10-digit mobile number.'
        );
        hasError = true;
        if (!firstErrorField) firstErrorField = this.identifierInput;
      }
    }

    // 2. Validate Password Required
    if (!passwordVal) {
      this.setFieldError(
        this.passwordInput, 
        this.passwordError, 
        'Password is required. Please enter your password.'
      );
      hasError = true;
      if (!firstErrorField) firstErrorField = this.passwordInput;
    }

    if (hasError) {
      if (firstErrorField) firstErrorField.focus();
      return;
    }

    // Successful Demo Login
    this.clearAllErrors();
    
    // Login to state and smoothly navigate to Home
    state.login({ identifier: identifierVal });
  }

  setFieldError(inputEl, errorEl, message) {
    if (inputEl) {
      inputEl.classList.add('has-error');
      inputEl.setAttribute('aria-invalid', 'true');
    }
    if (errorEl) {
      errorEl.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="err-icon" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>${message}</span>
      `;
      errorEl.style.display = 'flex';
    }
  }

  clearFieldError(inputEl, errorEl) {
    if (inputEl) {
      inputEl.classList.remove('has-error');
      inputEl.removeAttribute('aria-invalid');
    }
    if (errorEl) {
      errorEl.innerHTML = '';
      errorEl.style.display = 'none';
    }
  }

  clearAllErrors() {
    this.clearFieldError(this.identifierInput, this.identifierError);
    this.clearFieldError(this.passwordInput, this.passwordError);
    this.hideAlert();
    if (this.googleNotice) {
      this.googleNotice.style.display = 'none';
    }
  }

  getGoogleClientId() {
    // Inspect frontend configurations for Google OAuth Web Client ID
    const metaTag = document.querySelector('meta[name="google-signin-client_id"]');
    const metaClientId = metaTag ? metaTag.getAttribute('content') : null;
    const windowClientId = (typeof window !== 'undefined' && window.KISAN_CONFIG?.GOOGLE_CLIENT_ID) || (typeof window !== 'undefined' && window.googleClientId) || null;
    const localClientId = typeof localStorage !== 'undefined' ? (localStorage.getItem('google_client_id') || localStorage.getItem('kisan_google_client_id')) : null;

    const candidate = windowClientId || metaClientId || localClientId;
    if (candidate && typeof candidate === 'string' && candidate.trim().length > 5) {
      return candidate.trim();
    }
    return null;
  }

  initGoogleAuth() {
    const clientId = this.getGoogleClientId();

    // 1. Setup click handler for fallback / demo button
    if (this.googleBtn) {
      this.googleBtn.addEventListener('click', (e) => {
        e.preventDefault();

        const activeClientId = this.getGoogleClientId();

        // If a valid Client ID exists: trigger Google Identity Services account selection
        if (activeClientId && window.google?.accounts?.id) {
          try {
            window.google.accounts.id.prompt((notification) => {
              if (notification && (notification.isNotDisplayed() || notification.isSkippedMoment())) {
                this.showAlert('Please select your Google account from the sign-in prompt.', 'info');
              }
            });
          } catch (err) {
            console.warn('[Google Auth] Prompt warning:', err);
          }
          return;
        }

        // If NO Client ID exists:
        // Do NOT fake a Google account login.
        // Show: "Google Sign-In demo is not configured yet."
        // Explain that a Google OAuth Client ID is required.
        // Do NOT set isAuthenticated=true.
        const titleMsg = 'Google Sign-In demo is not configured yet.';
        const detailMsg = 'A Google OAuth Client ID is required to enable Google account selection.';
        const fullMsg = `${titleMsg} ${detailMsg}`;

        if (this.googleNotice) {
          this.googleNotice.textContent = fullMsg;
          this.googleNotice.style.display = 'block';
        }
        this.showAlert(titleMsg, 'info');
      });
    }

    // 2. If a valid Client ID already exists, configure official Google Identity Services
    if (clientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            this.handleGoogleCredentialResponse(response);
          },
          auto_select: false,
          cancel_on_tap_outside: true
        });

        if (this.googleMount) {
          window.google.accounts.id.renderButton(this.googleMount, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left'
          });

          // If official live button rendered, hide manual button
          if (this.googleBtn) {
            this.googleBtn.style.display = 'none';
          }
        }
      } catch (err) {
        console.warn('[Google Auth] GIS live init skipped:', err);
      }
    }
  }

  handleGoogleCredentialResponse(response) {
    if (!response || !response.credential) {
      this.showAlert('Google Sign-In could not retrieve credentials.', 'error');
      return;
    }

    try {
      // Decode JWT payload on frontend ONLY (no server-side token verification, no database)
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);

      // Create a DEMO frontend session using the existing state/session system
      // Clearly marked as DEMO / frontend-only:
      state.login({
        name: payload.name || 'Google Farmer',
        email: payload.email || '',
        avatar: payload.picture || null,
        identifier: payload.email || 'google.demo.user',
        authProvider: 'google',
        isDemoSession: true,
        authLabel: 'Frontend Demo (Google)'
      });

      this.clearAllErrors();
      // Do NOT send or store the ID token as a fake backend-authenticated session.
    } catch (err) {
      console.error('[Google Auth] Error decoding credential in frontend demo:', err);
      this.showAlert('Failed to process Google sign-in demo.', 'error');
    }
  }

  showAlert(message, type = 'error') {
    if (!this.alertBanner || !this.alertText) return;
    this.alertText.textContent = message;
    this.alertBanner.className = `login-alert-banner ${type}`;
    this.alertBanner.style.display = 'flex';
  }

  hideAlert() {
    if (this.alertBanner) {
      this.alertBanner.style.display = 'none';
    }
  }
}

