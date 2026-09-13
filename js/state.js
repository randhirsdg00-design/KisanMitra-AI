/* =========================================================
   KisanMitra AI — Reactive State Management Store
   ========================================================= */

import { INITIAL_ACTIVITY, INITIAL_PLOTS, SAMPLES } from './data.js';

class AppState {
  constructor() {
    this.currentView = 'app'; // Open directly to Home screen
    this.isAuthenticated = false;
    this.postLoginRedirect = null;
    this.pendingSampleId = null;
    this.loginNotice = null;
    this.user = {
      name: 'Rajesh Kumar',
      identifier: '9876543210',
      phone: '9876543210',
      email: '',
      state: 'Punjab',
      district: 'Ludhiana',
      status: 'Active · Verified Farmer',
      isDemo: true
    };
    this.currentTab = 'home';
    this.language = 'en';
    this.recentActivity = [...INITIAL_ACTIVITY];
    this.scansHistory = [...SAMPLES];
    this.farmPlots = [...INITIAL_PLOTS];
    this.chatMessages = [
      {
        id: 'msg-welcome',
        sender: 'bot',
        text: `Namaste! I'm AI Mitra 👋\n\nI can help you with crops, farming practices, crop problems, mandi prices, and government schemes.`,
        time: 'Just now'
      }
    ];
    this.activeModal = null;
    this.activeDiagnosis = null;
    this.historyFilter = 'all';
    this.schemesFilter = 'all';
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event, payload) {
    for (const listener of this.listeners) {
      listener(event, payload, this);
    }
  }

  setView(view) {
    this.currentView = view;
    this.notify('viewChange', view);
  }

  login(credentials = null) {
    this.isAuthenticated = true;
    if (credentials) {
      if (credentials.name) this.user.name = credentials.name;
      if (credentials.email) this.user.email = credentials.email;
      if (credentials.phone) this.user.phone = credentials.phone;
      if (credentials.avatar) this.user.avatar = credentials.avatar;
      if (credentials.authProvider) this.user.authProvider = credentials.authProvider;
      if (credentials.isDemoSession !== undefined) this.user.isDemoSession = credentials.isDemoSession;
      if (credentials.authLabel) this.user.authLabel = credentials.authLabel;

      if (credentials.identifier) {
        this.user.identifier = credentials.identifier;
        if (!credentials.email && credentials.identifier.includes('@')) {
          this.user.email = credentials.identifier;
          if (!credentials.name) {
            const username = credentials.identifier.split('@')[0];
            this.user.name = username.charAt(0).toUpperCase() + username.slice(1);
          }
        } else if (!credentials.phone && !credentials.identifier.includes('@')) {
          this.user.phone = credentials.identifier;
        }
      }
    }

    const targetTab = this.postLoginRedirect || 'home';
    const pendingSample = this.pendingSampleId;
    this.postLoginRedirect = null;
    this.pendingSampleId = null;
    this.loginNotice = null;

    this.currentView = 'app';
    this.currentTab = targetTab;
    this.notify('loginSuccess', { user: this.user, targetTab, pendingSample });
    this.notify('viewChange', 'app');
    this.notify('tabChange', targetTab);
  }

  updateProfile(profileData) {
    this.user = {
      ...this.user,
      ...profileData,
      isDemo: false
    };
    this.notify('profileUpdated', this.user);
  }

  logout() {
    this.isAuthenticated = false;
    this.postLoginRedirect = null;
    this.pendingSampleId = null;
    this.loginNotice = null;
    this.currentView = 'app';
    this.currentTab = 'home';
    this.notify('logout');
    this.notify('viewChange', 'app');
    this.notify('tabChange', 'home');
  }

  setTab(tab) {
    this.currentTab = tab;
    this.notify('tabChange', tab);
  }

  setLanguage(lang) {
    this.language = lang;
    this.notify('langChange', lang);
  }

  toggleLanguage() {
    const nextLang = this.language === 'en' ? 'hi' : 'en';
    this.setLanguage(nextLang);
    return nextLang;
  }

  openModal(modalId) {
    this.activeModal = modalId;
    this.notify('modalOpen', modalId);
  }

  closeModal() {
    const prev = this.activeModal;
    this.activeModal = null;
    this.notify('modalClose', prev);
  }

  setDiagnosis(diagnosis) {
    this.activeDiagnosis = diagnosis;
    this.notify('diagnosisReady', diagnosis);
  }

  addScanToHistory(scan) {
    // Add to front of history
    this.scansHistory.unshift(scan);
    // Add to recent activity
    this.recentActivity.unshift({
      id: 'act-' + Date.now(),
      title: `🌿 ${scan.crop} leaf analysis`,
      crop: scan.crop,
      disease: scan.disease,
      timeAgo: 'Just now',
      status: scan.severity,
      statusText: 'Analysis completed',
      confidence: scan.confidence,
      sampleId: scan.id
    });
    this.notify('historyUpdated', this.scansHistory);
  }

  deleteScanFromHistory(scanId) {
    this.scansHistory = this.scansHistory.filter(s => s.id !== scanId);
    this.recentActivity = this.recentActivity.filter(a => a.sampleId !== scanId && a.id !== scanId);
    this.notify('historyUpdated', this.scansHistory);
  }

  addPlot(plot) {
    this.farmPlots.unshift(plot);
    this.notify('plotsUpdated', this.farmPlots);
  }

  updatePlot(id, updatedPlot) {
    const idx = this.farmPlots.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.farmPlots[idx] = { ...this.farmPlots[idx], ...updatedPlot };
      this.notify('plotsUpdated', this.farmPlots);
    }
  }

  deletePlot(id) {
    this.farmPlots = this.farmPlots.filter(p => p.id !== id);
    this.notify('plotsUpdated', this.farmPlots);
  }

  addChatMessage(sender, text) {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msg = {
      id: 'msg-' + Date.now(),
      sender,
      text,
      time: timeStr
    };
    this.chatMessages.push(msg);
    this.notify('chatUpdated', msg);
    return msg;
  }

  setHistoryFilter(filter) {
    this.historyFilter = filter;
    this.notify('historyFilterChange', filter);
  }

  setSchemesFilter(filter) {
    this.schemesFilter = filter;
    this.notify('schemesFilterChange', filter);
  }

  resetToDefaults() {
    this.scansHistory = [...SAMPLES];
    this.recentActivity = [...INITIAL_ACTIVITY];
    this.farmPlots = [...INITIAL_PLOTS];
    this.chatMessages = [
      {
        id: 'msg-welcome',
        sender: 'bot',
        text: `Namaste! I'm AI Mitra 👋\n\nI can help you with crops, farming practices, crop problems, mandi prices, and government schemes.`,
        time: 'Just now'
      }
    ];
    this.historyFilter = 'all';
    this.schemesFilter = 'all';
    this.notify('historyUpdated', this.scansHistory);
    this.notify('plotsUpdated', this.farmPlots);
    this.notify('chatUpdated');
    return true;
  }
}

export const state = new AppState();

