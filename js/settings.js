/* =========================================================
   KisanMitra AI — Settings & Preferences Controller
   Clean, Professional, Honest & Accessible Preferences Flow
   ========================================================= */

import { state } from './state.js';

export class SettingsManager {
  constructor() {
    this.view = document.getElementById('tab-settings');
    this.btnBackHome = document.getElementById('btn-settings-back-home');
    this.btnLangEn = document.getElementById('btn-settings-lang-en');
    this.btnLangHi = document.getElementById('btn-settings-lang-hi');
    this.btnToProfile = document.getElementById('btn-settings-to-profile');
    this.btnToFarm = document.getElementById('btn-settings-to-farm');
    this.btnLogout = document.getElementById('btn-settings-logout');
    
    // Danger Zone Modal Controls
    this.btnResetData = document.getElementById('btn-settings-reset-data');
    this.modalReset = document.getElementById('modal-reset-confirm');
    this.btnCloseResetModal = document.getElementById('btn-close-reset-modal');
    this.btnCancelReset = document.getElementById('btn-cancel-reset-data');
    this.btnConfirmReset = document.getElementById('btn-confirm-reset-data');

    this.init();
  }

  init() {
    this.bindEvents();
    this.syncLanguageState(state.language);

    // Subscribe to state changes
    state.subscribe((event, payload) => {
      if (event === 'langChange') {
        this.syncLanguageState(payload);
      }
    });
  }

  bindEvents() {
    // 1. Back to Home navigation
    if (this.btnBackHome) {
      this.btnBackHome.addEventListener('click', () => {
        state.setTab('home');
      });
    }

    // 2. Language Selection
    if (this.btnLangEn) {
      this.btnLangEn.addEventListener('click', () => {
        if (state.language !== 'en') {
          state.setLanguage('en');
          this.showToast('Language updated to English.');
        }
      });
    }

    if (this.btnLangHi) {
      this.btnLangHi.addEventListener('click', () => {
        if (state.language !== 'hi') {
          state.setLanguage('hi');
          this.showToast('भाषा बदलकर हिन्दी कर दी गई है।');
        }
      });
    }

    // 3. Account Shortcuts
    if (this.btnToProfile) {
      this.btnToProfile.addEventListener('click', () => {
        state.setTab('profile');
      });
    }

    if (this.btnToFarm) {
      this.btnToFarm.addEventListener('click', () => {
        state.setTab('farm');
      });
    }

    if (this.btnLogout) {
      this.btnLogout.addEventListener('click', () => {
        state.logout();
      });
    }

    // 4. Danger Zone: Reset Demo Data
    if (this.btnResetData && this.modalReset) {
      this.btnResetData.addEventListener('click', () => {
        this.openResetModal();
      });
    }

    if (this.btnCloseResetModal) {
      this.btnCloseResetModal.addEventListener('click', () => {
        this.closeResetModal();
      });
    }

    if (this.btnCancelReset) {
      this.btnCancelReset.addEventListener('click', () => {
        this.closeResetModal();
      });
    }

    if (this.btnConfirmReset) {
      this.btnConfirmReset.addEventListener('click', () => {
        this.handleResetData();
      });
    }

    // Close modal on click outside container
    if (this.modalReset) {
      this.modalReset.addEventListener('click', (e) => {
        if (e.target === this.modalReset) {
          this.closeResetModal();
        }
      });
    }

    // Accessible keyboard escape handler
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalReset && this.modalReset.style.display === 'flex') {
        this.closeResetModal();
      }
    });
  }

  syncLanguageState(lang) {
    if (this.btnLangEn) {
      const isEn = lang === 'en';
      this.btnLangEn.classList.toggle('active', isEn);
      this.btnLangEn.setAttribute('aria-checked', isEn ? 'true' : 'false');
    }
    if (this.btnLangHi) {
      const isHi = lang === 'hi';
      this.btnLangHi.classList.toggle('active', isHi);
      this.btnLangHi.setAttribute('aria-checked', isHi ? 'true' : 'false');
    }
  }

  openResetModal() {
    if (this.modalReset) {
      this.modalReset.style.display = 'flex';
      state.openModal('modal-reset-confirm');
      if (this.btnCancelReset) {
        this.btnCancelReset.focus();
      }
    }
  }

  closeResetModal() {
    if (this.modalReset) {
      this.modalReset.style.display = 'none';
      state.closeModal();
      if (this.btnResetData) {
        this.btnResetData.focus();
      }
    }
  }

  handleResetData() {
    state.resetToDefaults();
    this.closeResetModal();
    this.showToast('Application demo data has been reset to defaults.');
  }

  showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-notification toast-success';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px; flex-shrink: 0;" aria-hidden="true">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }
}
