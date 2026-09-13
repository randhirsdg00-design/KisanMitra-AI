/* =========================================================
   KisanMitra AI — Main Application Controller & Router
   Professional Agriculture Platform
   ========================================================= */

import { LoginManager } from './login.js';
import { CropScanner } from './scanner.js';
import { AIChatMitra } from './chat.js';
import { FarmManager } from './farm.js';
import { HistoryManager } from './history.js';
import { SchemesManager } from './schemes.js';
import { MandiPricesManager } from './mandi.js';
import { ProfileManager } from './profile.js';
import { SettingsManager } from './settings.js';
import { state } from './state.js';
import { TRANSLATIONS } from './data.js';

class App {
  constructor() {
    this.login = null;
    this.scanner = null;
    this.chat = null;
    this.farm = null;
    this.history = null;
    this.schemes = null;
    this.mandi = null;
    this.profile = null;
    this.settings = null;
    
    this.init();
  }

  init() {
    // Instantiate core modules
    this.login = new LoginManager();
    this.scanner = new CropScanner();
    this.chat = new AIChatMitra();
    this.farm = new FarmManager();
    this.history = new HistoryManager();
    this.schemes = new SchemesManager();
    this.mandi = new MandiPricesManager();
    this.profile = new ProfileManager();
    this.settings = new SettingsManager();

    // Expose for runtime inspection and test runners
    window.kisanApp = this;
    window.kisanLoginManager = this.login;

    this.setupDynamicGreeting();
    this.renderRecentActivity();
    this.bindNavigation();
    this.bindQuickActions();
    this.bindHeroScan();
    this.bindLanguageToggle();
    this.bindProfile();
    this.bindSettings();

    // Subscribe to state changes
    state.subscribe((event, payload) => {
      if (event === 'viewChange') {
        this.updateActiveView(payload);
      } else if (event === 'tabChange') {
        this.updateActiveTab(payload);
      } else if (event === 'historyUpdated') {
        this.renderRecentActivity();
      } else if (event === 'langChange') {
        this.applyTranslations(payload);
      } else if (event === 'loginSuccess') {
        const userObj = payload && payload.user ? payload.user : payload;
        this.updateUserProfile(userObj);
        if (payload && payload.pendingSample && this.scanner) {
          const sample = state.scansHistory.find(s => s.id === payload.pendingSample);
          if (sample) {
            this.scanner.showPreview(sample.image, `${sample.crop} leaf`, `0.8 MB · JPG`, sample.id);
          }
        }
      } else if (event === 'profileUpdated') {
        this.updateUserProfile(payload);
      } else if (event === 'logout') {
        this.handleUserLogout();
      }
    });

    // Initial view setup
    this.updateActiveView(state.currentView);
    this.updateActiveTab(state.currentTab);
  }

  setupDynamicGreeting() {
    const greetingEl = document.getElementById('farmer-greeting-title');
    if (!greetingEl) return;

    const hour = new Date().getHours();
    let timeGreeting = 'Good morning';
    if (hour >= 12 && hour < 17) {
      timeGreeting = 'Good afternoon';
    } else if (hour >= 17) {
      timeGreeting = 'Good evening';
    }

    const lang = state.language;
    if (lang === 'hi') {
      greetingEl.innerHTML = `नमस्ते, किसान भाई 👋`;
    } else {
      greetingEl.innerHTML = `${timeGreeting}, Farmer 👋`;
    }
  }

  bindNavigation() {
    // Desktop Navigation
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetTab = btn.dataset.tab;
        if (targetTab) {
          state.setTab(targetTab);
        }
      });
    });

    // Mobile Bottom Navigation
    const mobNavBtns = document.querySelectorAll('.mobile-nav-item');
    mobNavBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetTab = btn.dataset.tab;
        if (targetTab) {
          state.setTab(targetTab);
        }
      });
    });

    // Brand logo click goes to home
    const brand = document.querySelector('.brand');
    if (brand) {
      brand.addEventListener('click', (e) => {
        e.preventDefault();
        state.setTab('home');
      });
    }

    // "View all →" button on Home activity
    const viewAllBtn = document.getElementById('btn-view-all-activity');
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', (e) => {
        e.preventDefault();
        state.setTab('history');
      });
    }
  }

  updateActiveTab(tabName) {
    // Update desktop nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update mobile bottom nav buttons
    document.querySelectorAll('.mobile-nav-item').forEach(btn => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
      if (pane.id === `tab-${tabName}`) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    // Update profile button active state
    const profileBtn = document.querySelector('.profile-btn');
    if (profileBtn) {
      if (tabName === 'profile') {
        profileBtn.classList.add('active');
      } else {
        profileBtn.classList.remove('active');
      }
    }

    // Update settings button active state
    const settingsBtn = document.getElementById('btn-header-settings');
    if (settingsBtn) {
      if (tabName === 'settings') {
        settingsBtn.classList.add('active');
      } else {
        settingsBtn.classList.remove('active');
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  requireAuthForScan(onAuthenticated, sampleId = null) {
    if (state.isAuthenticated) {
      onAuthenticated();
    } else {
      state.postLoginRedirect = 'scan';
      state.pendingSampleId = sampleId;
      state.loginNotice = 'Please log in to scan your crop. Your account helps keep your crop analysis linked to your session.';
      state.setView('login');
    }
  }

  bindHeroScan() {
    // Primary Hero [ Scan Crop ] button -> checks auth then opens Scan Page
    const btnScan = document.getElementById('btn-hero-scan');
    if (btnScan) {
      btnScan.addEventListener('click', () => {
        this.requireAuthForScan(() => {
          if (this.scanner) this.scanner.resetScanFlow();
          state.setTab('scan');
        });
      });
    }

    // Hero quick sample chips -> checks auth then navigates with sample preview
    const sampleChips = document.querySelectorAll('.hero-scan-card .sample-chip');
    sampleChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const sampleId = chip.dataset.sampleId;
        this.requireAuthForScan(() => {
          const sample = state.scansHistory.find(s => s.id === sampleId);
          if (sample && this.scanner) {
            state.setTab('scan');
            this.scanner.showPreview(sample.image, `${sample.crop} leaf`, `0.8 MB · JPG`, sampleId);
          }
        }, sampleId);
      });
    });
  }

  bindQuickActions() {
    const actions = [
      { id: 'card-action-mitra', handler: () => this.chat.openChat() },
      { id: 'card-action-farm', handler: () => state.setTab('farm') },
      { id: 'card-action-history', handler: () => state.setTab('history') },
      { id: 'card-action-schemes', handler: () => state.setTab('schemes') }
    ];

    actions.forEach(({ id, handler }) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', handler);
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handler();
          }
        });
      }
    });
  }

  renderRecentActivity() {
    const listContainer = document.getElementById('recent-activity-list');
    if (!listContainer) return;

    // Empty state handling
    if (!state.recentActivity || state.recentActivity.length === 0) {
      listContainer.innerHTML = `
        <div class="activity-empty-state">
          <div class="empty-state-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
          </div>
          <h3 class="empty-state-title">No scans yet</h3>
          <p class="empty-state-desc">Scan your first crop to see your analysis here.</p>
          <button class="btn-empty-scan" id="btn-empty-scan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;" aria-hidden="true">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
            <span>Scan Crop</span>
          </button>
        </div>
      `;

      const btnEmpty = document.getElementById('btn-empty-scan');
      if (btnEmpty) {
        btnEmpty.addEventListener('click', () => {
          this.requireAuthForScan(() => {
            if (this.scanner) this.scanner.resetScanFlow();
            state.setTab('scan');
          });
        });
      }
      return;
    }

    // List rows with consistent clean UI icons
    listContainer.innerHTML = state.recentActivity.map(item => `
      <div class="activity-item" data-sample-id="${item.sampleId}" role="button" tabindex="0">
        <div class="activity-left">
          <div class="activity-avatar" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
            </svg>
          </div>
          <div class="activity-details">
            <div class="activity-title">${item.title}</div>
            <div class="activity-subtitle">
              <span class="status-badge ${item.status}">${item.statusText || 'Analysis completed'}</span>
              <span>·</span>
              <span class="activity-time">${item.timeAgo}</span>
            </div>
          </div>
        </div>
        <div class="activity-right">
          <span class="activity-arrow" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </span>
        </div>
      </div>
    `).join('');

    // Bind clicks & keyboard events
    listContainer.querySelectorAll('.activity-item').forEach(el => {
      const openDetail = () => {
        const sampleId = el.dataset.sampleId;
        const sample = state.scansHistory.find(s => s.id === sampleId);
        if (sample) {
          this.history.openDetailModal(sample);
        }
      };
      el.addEventListener('click', openDetail);
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openDetail();
        }
      });
    });
  }

  bindLanguageToggle() {
    const langBtn = document.getElementById('btn-lang-toggle');
    if (!langBtn) return;

    langBtn.addEventListener('click', () => {
      state.toggleLanguage();
    });
  }

  applyTranslations(lang) {
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    // Update nav labels
    const navMap = {
      'nav-home': t.navHome,
      'nav-farm': t.navFarm,
      'nav-history': t.navHistory,
      'nav-schemes': t.navSchemes,
      'mob-nav-home': t.navHome,
      'mob-nav-farm': t.navFarm,
      'mob-nav-history': t.navHistory,
      'mob-nav-schemes': t.navSchemes,
      'nav-mandi': t.navMandi || 'Mandi Rates',
      'mob-nav-mandi': t.navMandi || 'Mandi'
    };
    for (const [id, val] of Object.entries(navMap)) {
      const el = document.getElementById(id);
      if (el) {
        const labelEl = el.querySelector('.label') || el.querySelector('span:last-child');
        if (labelEl) labelEl.textContent = val;
      }
    }

    // Toggle button text
    const langText = document.getElementById('lang-btn-text');
    if (langText) {
      langText.textContent = t.langToggleText;
    }

    // Greeting
    this.setupDynamicGreeting();

    // Hero labels
    const heroTitle = document.getElementById('hero-title-text');
    if (heroTitle) heroTitle.textContent = t.scanHeroTitle;

    const heroDesc = document.getElementById('hero-desc-text');
    if (heroDesc) heroDesc.textContent = t.scanHeroDesc;

    const scanBtn = document.getElementById('btn-hero-scan');
    if (scanBtn) {
      const scanSpan = scanBtn.querySelector('span:last-child');
      if (scanSpan) scanSpan.textContent = t.btnScanCrop;
    }

    // Quick Actions
    const mitraTitle = document.getElementById('action-mitra-title');
    if (mitraTitle) mitraTitle.textContent = t.actionMitraTitle;
    const mitraDesc = document.getElementById('action-mitra-desc');
    if (mitraDesc) mitraDesc.textContent = t.actionMitraDesc;

    const farmTitle = document.getElementById('action-farm-title');
    if (farmTitle) farmTitle.textContent = t.actionFarmTitle;
    const farmDesc = document.getElementById('action-farm-desc');
    if (farmDesc) farmDesc.textContent = t.actionFarmDesc;

    const histTitle = document.getElementById('action-history-title');
    if (histTitle) histTitle.textContent = t.actionHistoryTitle;
    const histDesc = document.getElementById('action-history-desc');
    if (histDesc) histDesc.textContent = t.actionHistoryDesc;

    const schemesTitle = document.getElementById('action-schemes-title');
    if (schemesTitle) schemesTitle.textContent = t.actionSchemesTitle;
    const schemesDesc = document.getElementById('action-schemes-desc');
    if (schemesDesc) schemesDesc.textContent = t.actionSchemesDesc;

    // Recent activity & help banner
    const recentHeading = document.getElementById('heading-recent-activity');
    if (recentHeading) recentHeading.textContent = t.recentActivityTitle;
    const viewAll = document.getElementById('btn-view-all-activity');
    if (viewAll) {
      const viewAllSpan = viewAll.querySelector('span');
      if (viewAllSpan) viewAllSpan.textContent = t.viewAll;
    }

    const needHelpTitle = document.getElementById('need-help-title');
    if (needHelpTitle) needHelpTitle.textContent = t.needHelpTitle;
    const needHelpDesc = document.getElementById('need-help-desc');
    if (needHelpDesc) needHelpDesc.textContent = t.needHelpDesc;
    const btnAskMitra = document.getElementById('btn-home-ask-mitra');
    if (btnAskMitra) {
      const btnSpan = btnAskMitra.querySelector('span:last-child');
      if (btnSpan) btnSpan.textContent = t.btnAskMitra;
    }
  }

  updateActiveView(view) {
    const loginView = document.getElementById('view-login');
    const siteHeader = document.querySelector('.site-header');
    const mainContent = document.getElementById('main-content');
    const mobileBottomNav = document.querySelector('.mobile-bottom-nav');
    const floatingChat = document.getElementById('btn-floating-chat');
    const chatDrawer = document.getElementById('chat-drawer');

    if (view === 'login') {
      if (loginView) loginView.style.display = 'flex';
      if (siteHeader) siteHeader.style.display = 'none';
      if (mainContent) mainContent.style.display = 'none';
      if (mobileBottomNav) mobileBottomNav.style.display = 'none';
      if (floatingChat) floatingChat.style.display = 'none';
      if (chatDrawer) chatDrawer.classList.remove('open');
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      if (loginView) loginView.style.display = 'none';
      if (siteHeader) siteHeader.style.display = '';
      if (mainContent) mainContent.style.display = '';
      if (mobileBottomNav) mobileBottomNav.style.display = '';
      if (floatingChat) floatingChat.style.display = '';
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  bindProfile() {
    const profileBtn = document.querySelector('.profile-btn');
    if (profileBtn) {
      profileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        state.setTab('profile');
      });
      profileBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          state.setTab('profile');
        }
      });
    }
  }

  bindSettings() {
    const headerSettingsBtn = document.getElementById('btn-header-settings');
    if (headerSettingsBtn) {
      headerSettingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        state.setTab('settings');
      });
    }

    const profileSettingsBtn = document.getElementById('btn-profile-go-settings');
    if (profileSettingsBtn) {
      profileSettingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        state.setTab('settings');
      });
    }
  }

  handleUserLogout() {
    this.updateActiveView('app');
    this.updateActiveTab('home');
    const loginIdentifier = document.getElementById('login-identifier');
    const loginPassword = document.getElementById('login-password');
    if (loginIdentifier) loginIdentifier.value = '';
    if (loginPassword) loginPassword.value = '';
  }

  updateUserProfile(user) {
    if (!user) return;
    const profileName = document.querySelector('.profile-btn .name');
    if (profileName && user.name) {
      profileName.textContent = user.name;
    }
    const greetingEl = document.getElementById('farmer-greeting-title');
    if (greetingEl && user.name) {
      const hour = new Date().getHours();
      let timeGreeting = 'Good morning';
      if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
      else if (hour >= 17) timeGreeting = 'Good evening';
      greetingEl.innerHTML = `${timeGreeting}, ${user.name} 👋`;
    }
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
