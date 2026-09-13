/* =========================================================
   KisanMitra AI — Farmer Profile Controller
   Clean, Accessible, Professional Agricultural Account Management
   ========================================================= */

import { state } from './state.js';

export class ProfileManager {
  constructor() {
    // Header & User Identity
    this.userNameEl = document.getElementById('profile-user-name');
    this.userStatusEl = document.getElementById('profile-user-status');
    this.avatarInitialsEl = document.getElementById('profile-avatar-initials');
    this.demoBadgeEl = document.getElementById('profile-demo-badge');
    this.demoBannerEl = document.getElementById('profile-demo-banner');

    // Profile Details Fields
    this.infoNameEl = document.getElementById('profile-info-name');
    this.infoPhoneEl = document.getElementById('profile-info-phone');
    this.infoEmailEl = document.getElementById('profile-info-email');
    this.infoStateEl = document.getElementById('profile-info-state');
    this.infoDistrictEl = document.getElementById('profile-info-district');
    this.infoLangEl = document.getElementById('profile-info-lang');

    // Farm Summary Stats
    this.statCropsEl = document.getElementById('profile-stat-crops');
    this.statLandEl = document.getElementById('profile-stat-land');
    this.statCropsListEl = document.getElementById('profile-stat-crops-list');

    // Actions & Buttons
    this.btnEditProfile = document.getElementById('btn-edit-profile');
    this.btnViewFarm = document.getElementById('btn-profile-view-farm');
    this.btnToggleLang = document.getElementById('btn-profile-toggle-lang');
    this.btnLogout = document.getElementById('btn-profile-logout');

    // Edit Modal Elements
    this.modalEdit = document.getElementById('modal-edit-profile');
    this.formEdit = document.getElementById('form-edit-profile');
    this.btnCloseModal = document.getElementById('btn-close-profile-modal');
    this.btnCancelEdit = document.getElementById('btn-cancel-edit-profile');

    this.inputName = document.getElementById('edit-profile-name');
    this.inputPhone = document.getElementById('edit-profile-phone');
    this.inputEmail = document.getElementById('edit-profile-email');
    this.inputState = document.getElementById('edit-profile-state');
    this.inputDistrict = document.getElementById('edit-profile-district');
    this.inputLang = document.getElementById('edit-profile-lang');

    this.errName = document.getElementById('error-edit-profile-name');
    this.errPhone = document.getElementById('error-edit-profile-phone');
    this.errEmail = document.getElementById('error-edit-profile-email');

    this.init();
  }

  init() {
    this.renderProfile();
    this.bindEvents();

    // Subscribe to state updates
    state.subscribe((event) => {
      if (event === 'profileUpdated' || event === 'loginSuccess' || event === 'langChange' || event === 'plotsUpdated') {
        this.renderProfile();
      } else if (event === 'tabChange' && state.currentTab === 'profile') {
        this.renderProfile();
      }
    });
  }

  bindEvents() {
    // Open Edit Profile modal
    if (this.btnEditProfile) {
      this.btnEditProfile.addEventListener('click', () => {
        this.openEditModal();
      });
    }

    // View My Farm CTA
    if (this.btnViewFarm) {
      this.btnViewFarm.addEventListener('click', () => {
        state.setTab('farm');
      });
    }

    // Language Toggle action
    if (this.btnToggleLang) {
      this.btnToggleLang.addEventListener('click', () => {
        state.toggleLanguage();
      });
    }

    // Logout action
    if (this.btnLogout) {
      this.btnLogout.addEventListener('click', () => {
        this.handleLogout();
      });
    }

    // Close Edit Modal via Close button
    if (this.btnCloseModal) {
      this.btnCloseModal.addEventListener('click', () => {
        this.closeEditModal();
      });
    }

    // Cancel Edit Modal via Cancel button
    if (this.btnCancelEdit) {
      this.btnCancelEdit.addEventListener('click', () => {
        this.closeEditModal();
      });
    }

    // Close Edit Modal via backdrop click
    if (this.modalEdit) {
      this.modalEdit.addEventListener('click', (e) => {
        if (e.target === this.modalEdit) {
          this.closeEditModal();
        }
      });
    }

    // Keyboard Escape key to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalEdit && this.modalEdit.classList.contains('active')) {
        this.closeEditModal();
      }
    });

    // Handle Edit Form Submission
    if (this.formEdit) {
      this.formEdit.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveProfile();
      });
    }
  }

  computeInitials(name) {
    if (!name || typeof name !== 'string') return 'FP';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length > 0) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return 'FP';
  }

  renderProfile() {
    const user = state.user || {};
    const name = user.name || 'Farmer Profile';
    const phone = user.phone || user.identifier || 'Not provided';
    const email = user.email ? user.email : 'Not provided';
    const stateName = user.state || 'Not provided';
    const districtName = user.district || 'Not provided';
    const status = user.status || 'Active · Verified Farmer';
    const langText = state.language === 'hi' ? 'हिन्दी (Hindi)' : 'English';

    // Update Header
    if (this.userNameEl) this.userNameEl.textContent = name;
    if (this.userStatusEl) this.userStatusEl.textContent = status;
    if (this.avatarInitialsEl) this.avatarInitialsEl.textContent = this.computeInitials(name);

    // Update Demo status badge and banner
    if (user.isDemo !== false) {
      if (this.demoBadgeEl) {
        this.demoBadgeEl.style.display = 'inline-flex';
        this.demoBadgeEl.textContent = 'DEMO PROFILE';
      }
      if (this.demoBannerEl) {
        this.demoBannerEl.style.display = 'flex';
      }
    } else {
      if (this.demoBadgeEl) {
        this.demoBadgeEl.style.display = 'inline-flex';
        this.demoBadgeEl.textContent = 'CUSTOM PROFILE';
        this.demoBadgeEl.style.background = '#e0f2fe';
        this.demoBadgeEl.style.color = '#0369a1';
        this.demoBadgeEl.style.borderColor = '#bae6fd';
      }
      if (this.demoBannerEl) {
        this.demoBannerEl.style.display = 'none';
      }
    }

    // Update Details Fields
    if (this.infoNameEl) this.infoNameEl.textContent = name;
    if (this.infoPhoneEl) this.infoPhoneEl.textContent = phone.startsWith('+91') ? phone : (phone !== 'Not provided' ? '+91 ' + phone : phone);
    if (this.infoEmailEl) this.infoEmailEl.textContent = email;
    if (this.infoStateEl) this.infoStateEl.textContent = stateName;
    if (this.infoDistrictEl) this.infoDistrictEl.textContent = districtName;
    if (this.infoLangEl) this.infoLangEl.textContent = langText;

    // Update Farm Summary strictly from state.farmPlots
    const plots = Array.isArray(state.farmPlots) ? state.farmPlots : [];
    const totalArea = plots.reduce((sum, p) => sum + (parseFloat(p.area) || 0), 0);
    const uniqueCrops = [...new Set(plots.map(p => p.crop).filter(Boolean))];

    if (this.statCropsEl) {
      this.statCropsEl.textContent = `${plots.length}`;
    }
    if (this.statLandEl) {
      this.statLandEl.textContent = totalArea > 0 ? `${totalArea.toFixed(1)} Acres` : '0 Acres';
    }
    if (this.statCropsListEl) {
      this.statCropsListEl.textContent = uniqueCrops.length > 0 ? uniqueCrops.join(', ') : 'No crops registered';
    }

    // Keep header user name synced
    const headerName = document.querySelector('.profile-btn .name');
    if (headerName) {
      headerName.textContent = name;
    }
  }

  openEditModal() {
    if (!this.modalEdit) return;

    const user = state.user || {};
    if (this.inputName) this.inputName.value = user.name || '';
    if (this.inputPhone) this.inputPhone.value = user.phone || user.identifier || '';
    if (this.inputEmail) this.inputEmail.value = user.email || '';
    if (this.inputState) this.inputState.value = user.state || '';
    if (this.inputDistrict) this.inputDistrict.value = user.district || '';
    if (this.inputLang) this.inputLang.value = state.language || 'en';

    this.clearErrors();
    this.modalEdit.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (this.inputName) {
      setTimeout(() => this.inputName.focus(), 50);
    }
  }

  closeEditModal() {
    if (!this.modalEdit) return;
    this.modalEdit.classList.remove('active');
    document.body.style.overflow = '';
  }

  clearErrors() {
    [this.errName, this.errPhone, this.errEmail].forEach(el => {
      if (el) {
        el.textContent = '';
        el.style.display = 'none';
      }
    });
    [this.inputName, this.inputPhone, this.inputEmail].forEach(input => {
      if (input) input.classList.remove('has-error');
    });
  }

  handleSaveProfile() {
    this.clearErrors();

    const nameVal = this.inputName ? this.inputName.value.trim() : '';
    const phoneVal = this.inputPhone ? this.inputPhone.value.trim() : '';
    const emailVal = this.inputEmail ? this.inputEmail.value.trim() : '';
    const stateVal = this.inputState ? this.inputState.value.trim() : '';
    const districtVal = this.inputDistrict ? this.inputDistrict.value.trim() : '';
    const langVal = this.inputLang ? this.inputLang.value : 'en';

    let hasError = false;

    // Validate Name
    if (!nameVal || nameVal.length < 2) {
      if (this.errName) {
        this.errName.textContent = 'Please enter a valid full name (at least 2 characters).';
        this.errName.style.display = 'block';
      }
      if (this.inputName) this.inputName.classList.add('has-error');
      hasError = true;
    }

    // Validate Phone (10-digit mobile check)
    const phoneClean = phoneVal.replace(/\D/g, '');
    if (!phoneVal || phoneClean.length < 10) {
      if (this.errPhone) {
        this.errPhone.textContent = 'Please enter a valid 10-digit mobile number.';
        this.errPhone.style.display = 'block';
      }
      if (this.inputPhone) this.inputPhone.classList.add('has-error');
      hasError = true;
    }

    // Validate Email if provided
    if (emailVal && (!emailVal.includes('@') || !emailVal.includes('.'))) {
      if (this.errEmail) {
        this.errEmail.textContent = 'Please enter a valid email address.';
        this.errEmail.style.display = 'block';
      }
      if (this.inputEmail) this.inputEmail.classList.add('has-error');
      hasError = true;
    }

    if (hasError) return;

    // Save profile update to state
    state.updateProfile({
      name: nameVal,
      phone: phoneClean,
      identifier: phoneClean,
      email: emailVal,
      state: stateVal || 'Punjab',
      district: districtVal || 'Ludhiana',
      status: 'Active · Verified Farmer'
    });

    // Update language if altered
    if (langVal !== state.language) {
      state.setLanguage(langVal);
    }

    this.closeEditModal();
  }

  handleLogout() {
    const confirmLogout = window.confirm('Are you sure you want to log out of KisanMitra AI and return to the login screen?');
    if (confirmLogout) {
      state.logout();
    }
  }
}
