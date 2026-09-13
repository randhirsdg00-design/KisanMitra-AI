/* =========================================================
   KisanMitra AI — Mandi & Market Prices Controller
   Real-Time Agricultural Market Intelligence
   Fetches live price data from: GET /api/mandi/prices
   ========================================================= */

import { state } from './state.js';

// State-to-district mappings for cascading dropdowns
const STATE_DISTRICTS = {
  'Punjab': ['Ludhiana', 'Karnal', 'Moga', 'Fazilka', 'Jalandhar', 'Amritsar', 'Patiala', 'Bathinda', 'Sangrur'],
  'Haryana': ['Karnal', 'Kurukshetra', 'Ambala', 'Hisar', 'Sirsa', 'Panipat', 'Fatehabad'],
  'Madhya Pradesh': ['Indore', 'Sehore', 'Ujjain', 'Chhindwara', 'Bhopal', 'Dewas', 'Hoshangabad'],
  'Rajasthan': ['Bharatpur', 'Bikaner', 'Kota', 'Alwar', 'Sri Ganganagar', 'Jaipur', 'Jodhpur'],
  'Uttar Pradesh': ['Agra', 'Farrukhabad', 'Mathura', 'Aligarh', 'Meerut', 'Bareilly', 'Varanasi'],
  'Maharashtra': ['Nashik', 'Pune', 'Ahmednagar', 'Nagpur', 'Aurangabad', 'Solapur'],
  'Gujarat': ['Rajkot', 'Surat', 'Ahmedabad', 'Amreli', 'Junagadh'],
  'Karnataka': ['Kolar', 'Belagavi', 'Shimoga', 'Mysuru', 'Bengaluru']
};

export class MandiPricesManager {
  constructor() {
    this.apiUrl = '/api/mandi/prices';
    this.records = [];
    this.isLoading = false;
    this.isLive = false;

    // Filter controls
    this.commoditySelect = document.getElementById('mandi-filter-commodity');
    this.stateSelect = document.getElementById('mandi-filter-state');
    this.districtSelect = document.getElementById('mandi-filter-district');
    this.marketInput = document.getElementById('mandi-filter-market');
    this.searchInput = document.getElementById('mandi-filter-search');
    this.btnFilterApply = document.getElementById('btn-mandi-apply');
    this.btnFilterReset = document.getElementById('btn-mandi-reset');
    this.btnRefresh = document.getElementById('btn-mandi-refresh');

    // UI state containers
    this.statusBadge = document.getElementById('mandi-status-badge');
    this.statusPill = document.getElementById('mandi-source-pill');
    this.loadingState = document.getElementById('mandi-loading-state');
    this.emptyState = document.getElementById('mandi-empty-state');
    this.errorState = document.getElementById('mandi-error-state');
    this.errorMsg = document.getElementById('mandi-error-msg');
    this.btnRetry = document.getElementById('btn-mandi-retry');
    this.resultsContainer = document.getElementById('mandi-results-container');
    this.priceCardsGrid = document.getElementById('mandi-price-cards');
    this.statsSummary = document.getElementById('mandi-stats-summary');

    // API settings controls
    this.apiEndpointInput = document.getElementById('mandi-api-url-input');
    this.btnSaveApiUrl = document.getElementById('btn-save-api-url');
    this.btnToggleApiSettings = document.getElementById('btn-toggle-api-settings');
    this.apiSettingsBox = document.getElementById('mandi-api-settings-box');

    this.init();
  }

  init() {
    this.bindEvents();
    // Fetch initial prices if Mandi tab is opened
    state.subscribe((event, payload) => {
      if (event === 'tabChange' && payload === 'mandi') {
        if (this.records.length === 0 && !this.isLoading) {
          this.fetchPrices();
        }
      }
    });

    // Check saved custom API URL if present
    const savedUrl = localStorage.getItem('kisanmitra_mandi_api_url');
    if (savedUrl) {
      this.apiUrl = savedUrl;
      if (this.apiEndpointInput) this.apiEndpointInput.value = savedUrl;
    }
  }

  bindEvents() {
    // Cascading district population on state selection
    if (this.stateSelect) {
      this.stateSelect.addEventListener('change', () => {
        this.updateDistricts(this.stateSelect.value);
      });
    }

    // Apply filters
    if (this.btnFilterApply) {
      this.btnFilterApply.addEventListener('click', () => {
        this.fetchPrices();
      });
    }

    // Search on enter key
    if (this.searchInput) {
      this.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.fetchPrices();
        }
      });
    }

    // Refresh button
    if (this.btnRefresh) {
      this.btnRefresh.addEventListener('click', () => {
        this.fetchPrices();
      });
    }

    // Reset filters
    if (this.btnFilterReset) {
      this.btnFilterReset.addEventListener('click', () => {
        this.resetFilters();
        this.fetchPrices();
      });
    }

    // Retry on error
    if (this.btnRetry) {
      this.btnRetry.addEventListener('click', () => {
        this.fetchPrices();
      });
    }

    // Toggle API settings panel
    if (this.btnToggleApiSettings && this.apiSettingsBox) {
      this.btnToggleApiSettings.addEventListener('click', () => {
        const isHidden = this.apiSettingsBox.style.display === 'none';
        this.apiSettingsBox.style.display = isHidden ? 'block' : 'none';
      });
    }

    // Save custom API endpoint
    if (this.btnSaveApiUrl && this.apiEndpointInput) {
      this.btnSaveApiUrl.addEventListener('click', () => {
        const newUrl = this.apiEndpointInput.value.trim();
        if (newUrl) {
          this.apiUrl = newUrl;
          localStorage.setItem('kisanmitra_mandi_api_url', newUrl);
          this.showToast(`Updated API Endpoint to: ${newUrl}`);
          this.fetchPrices();
        }
      });
    }

    // Ask AI Mitra about this price
    if (this.cardsContainer) {
      this.cardsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-mandi-ask-mitra');
        if (!btn) return;
        const commodity = btn.dataset.commodity || 'commodity';
        const market = btn.dataset.market || 'market';
        const price = btn.dataset.price || '';
        const contextTitle = `${commodity} at ${market} Mandi (${price ? '₹' + price : ''})`;
        const prompt = `What is the price trend and selling advisory for ${commodity} in ${market} mandi?`;
        if (window.app && window.app.chat) {
          window.app.chat.openWithContext(contextTitle, prompt);
        } else {
          state.setTab('ai-mitra');
        }
      });
    }
  }

  updateDistricts(selectedState) {
    if (!this.districtSelect) return;
    this.districtSelect.innerHTML = '<option value="">All Districts</option>';

    if (selectedState && STATE_DISTRICTS[selectedState]) {
      STATE_DISTRICTS[selectedState].forEach(district => {
        const opt = document.createElement('option');
        opt.value = district;
        opt.textContent = district;
        this.districtSelect.appendChild(opt);
      });
      this.districtSelect.disabled = false;
    } else {
      this.districtSelect.disabled = false;
    }
  }

  resetFilters() {
    if (this.commoditySelect) this.commoditySelect.value = '';
    if (this.stateSelect) this.stateSelect.value = '';
    if (this.districtSelect) {
      this.districtSelect.innerHTML = '<option value="">All Districts</option>';
      this.districtSelect.value = '';
    }
    if (this.marketInput) this.marketInput.value = '';
    if (this.searchInput) this.searchInput.value = '';
  }

  async fetchPrices() {
    this.isLoading = true;
    this.showLoading();

    const commodity = this.commoditySelect ? this.commoditySelect.value.trim() : '';
    const stateVal = this.stateSelect ? this.stateSelect.value.trim() : '';
    const districtVal = this.districtSelect ? this.districtSelect.value.trim() : '';
    const marketVal = this.marketInput ? this.marketInput.value.trim() : '';
    const searchVal = this.searchInput ? this.searchInput.value.trim() : '';

    // Build URL query params
    const queryParams = new URLSearchParams();
    if (commodity && commodity !== 'all') queryParams.append('commodity', commodity);
    if (stateVal && stateVal !== 'all') queryParams.append('state', stateVal);
    if (districtVal && districtVal !== 'all') queryParams.append('district', districtVal);
    if (marketVal) queryParams.append('market', marketVal);
    if (searchVal) queryParams.append('search', searchVal);

    const fullUrl = queryParams.toString() 
      ? `${this.apiUrl}?${queryParams.toString()}` 
      : this.apiUrl;

    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to load data from ${this.apiUrl}`);
      }

      const json = await response.json();
      this.isLoading = false;
      this.isLive = true;

      // Extract records gracefully from standard JSON structures
      let records = [];
      if (Array.isArray(json)) {
        records = json;
      } else if (json.records && Array.isArray(json.records)) {
        records = json.records;
      } else if (json.data && Array.isArray(json.data)) {
        records = json.data;
      }

      this.records = records;

      if (records.length === 0) {
        this.showEmpty();
      } else {
        this.renderPrices(records, json.source || 'live');
      }

      this.updateStatusBadge(true, `Live API Connected (${records.length} records)`);
    } catch (err) {
      this.isLoading = false;
      this.isLive = false;
      this.showError(err.message || 'Unable to connect to /api/mandi/prices backend endpoint.');
      this.updateStatusBadge(false, 'API Disconnected');
    }
  }

  renderPrices(records, source = 'live') {
    this.hideAllStates();
    if (this.resultsContainer) this.resultsContainer.style.display = 'block';

    // Summary calculations
    const totalCount = records.length;
    const modalPrices = records.map(r => r.modal_price || r.price || 0).filter(p => p > 0);
    const avgPrice = modalPrices.length 
      ? Math.round(modalPrices.reduce((a, b) => a + b, 0) / modalPrices.length) 
      : 0;
    const uniqueMandis = new Set(records.map(r => r.market || r.mandi)).size;

    // Render Stats
    if (this.statsSummary) {
      this.statsSummary.innerHTML = `
        <div class="mandi-stat-card">
          <div class="stat-label">Active Mandis</div>
          <div class="stat-val">${uniqueMandis}</div>
          <div class="stat-sub">Markets reporting</div>
        </div>
        <div class="mandi-stat-card">
          <div class="stat-label">Average Modal Rate</div>
          <div class="stat-val">₹${avgPrice.toLocaleString('en-IN')}</div>
          <div class="stat-sub">Per Quintal</div>
        </div>
        <div class="mandi-stat-card">
          <div class="stat-label">Total Price Quotes</div>
          <div class="stat-val">${totalCount}</div>
          <div class="stat-sub">Live records fetched</div>
        </div>
        <div class="mandi-stat-card">
          <div class="stat-label">Data Connection</div>
          <div class="stat-val live-text">LIVE API</div>
          <div class="stat-sub">GET /api/mandi/prices</div>
        </div>
      `;
    }

    // Render Price Cards
    if (this.priceCardsGrid) {
      this.priceCardsGrid.innerHTML = records.map(item => {
        const commodity = item.commodity || item.Commodity || 'Agri Commodity';
        const variety = item.variety || item.Variety || 'Standard Variety';
        const market = item.market || item.Market || item.mandi || 'Local Mandi';
        const district = item.district || item.District || '';
        const stateName = item.state || item.State || '';
        const modalPrice = item.modal_price || item.Modal_Price || item.price || 0;
        const minPrice = item.min_price || item.Min_Price || modalPrice * 0.95;
        const maxPrice = item.max_price || item.Max_Price || modalPrice * 1.05;
        const unit = item.unit || item.Unit || '₹/Quintal';
        const date = item.arrival_date || item.date || 'Today';
        const trend = item.trend || 'stable';

        let trendIcon = `
          <span class="trend-pill stable">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Stable</span>
          </span>
        `;
        if (trend === 'up') {
          trendIcon = `
            <span class="trend-pill up">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
              <span>Rising</span>
            </span>
          `;
        } else if (trend === 'down') {
          trendIcon = `
            <span class="trend-pill down">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              <span>Easing</span>
            </span>
          `;
        }

        return `
          <div class="mandi-price-card" tabindex="0">
            <div class="card-top-row">
              <div>
                <h3 class="mandi-crop-title">${commodity}</h3>
                <div class="mandi-variety-chip">${variety}</div>
              </div>
              <span class="live-source-pill">
                <span class="live-dot"></span> LIVE API
              </span>
            </div>

            <div class="mandi-location-row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="loc-icon" aria-hidden="true">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span class="loc-text">${market}${district ? ', ' + district : ''} (${stateName})</span>
            </div>

            <div class="mandi-price-display">
              <div class="modal-price-val">₹${modalPrice.toLocaleString('en-IN')}</div>
              <div class="modal-price-unit">${unit}</div>
            </div>

            <div class="mandi-price-range-bar">
              <div class="range-labels">
                <span>Min: ₹${Math.round(minPrice).toLocaleString('en-IN')}</span>
                <span>Max: ₹${Math.round(maxPrice).toLocaleString('en-IN')}</span>
              </div>
              <div class="range-track">
                <div class="range-fill" style="width: 70%;"></div>
              </div>
            </div>

            <div class="card-footer-row">
              <div class="arrival-date">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span>Arrival: ${date}</span>
              </div>
              ${trendIcon}
            </div>

            <button type="button" class="btn-mandi-ask-mitra" data-commodity="${commodity}" data-market="${market}" data-price="${modalPrice}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;" aria-hidden="true">
                <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/>
              </svg>
              <span>Ask AI Mitra about this price</span>
            </button>
          </div>
        `;
      }).join('');
    }
  }

  showLoading() {
    this.hideAllStates();
    if (this.loadingState) this.loadingState.style.display = 'flex';
  }

  showEmpty() {
    this.hideAllStates();
    if (this.emptyState) this.emptyState.style.display = 'flex';
  }

  showError(message) {
    this.hideAllStates();
    if (this.errorState) {
      this.errorState.style.display = 'flex';
      if (this.errorMsg) {
        this.errorMsg.textContent = `${message} — Ensure your backend service is running and exposes GET /api/mandi/prices.`;
      }
    }
  }

  hideAllStates() {
    if (this.loadingState) this.loadingState.style.display = 'none';
    if (this.emptyState) this.emptyState.style.display = 'none';
    if (this.errorState) this.errorState.style.display = 'none';
    if (this.resultsContainer) this.resultsContainer.style.display = 'none';
  }

  updateStatusBadge(isOnline, label) {
    if (this.statusBadge) {
      this.statusBadge.className = isOnline ? 'mandi-status-badge online' : 'mandi-status-badge offline';
      this.statusBadge.innerHTML = `
        <span class="status-indicator-dot"></span>
        <span>${label}</span>
      `;
    }
  }

  showToast(msg) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3500);
  }
}
