/* =========================================================
   KisanMitra AI — Government Schemes Discovery Manager
   Professional Agriculture Platform
   ========================================================= */

import { SCHEMES } from './data.js';
import { state } from './state.js';

export class SchemesManager {
  constructor() {
    this.grid = document.getElementById('schemes-grid');
    this.searchInput = document.getElementById('schemes-search-input');
    this.filterContainer = document.getElementById('schemes-filter-pills');
    this.countBadge = document.getElementById('schemes-count-badge');
    this.emptyState = document.getElementById('schemes-empty-state');
    this.btnReset = document.getElementById('btn-schemes-reset');
    this.modalDetail = document.getElementById('modal-scheme-detail');
    this.modalBody = document.getElementById('scheme-modal-body');
    this.closeBtn = document.getElementById('btn-close-scheme-modal');

    this.init();
  }

  init() {
    this.renderSchemes();
    this.bindEvents();

    state.subscribe((event, payload) => {
      if (event === 'schemesFilterChange') {
        this.syncFilterPills(state.schemesFilter);
        this.renderSchemes();
      } else if (event === 'tabChange' && payload === 'schemes') {
        this.renderSchemes();
      }
    });
  }

  bindEvents() {
    // Filter pills click
    if (this.filterContainer) {
      this.filterContainer.addEventListener('click', (e) => {
        const pill = e.target.closest('.filter-pill');
        if (!pill) return;
        const filter = pill.dataset.filter || 'all';
        state.setSchemesFilter(filter);
      });
    }

    // Search input live query
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => {
        this.renderSchemes();
      });
    }

    // Reset filters button
    if (this.btnReset) {
      this.btnReset.addEventListener('click', () => {
        if (this.searchInput) this.searchInput.value = '';
        state.setSchemesFilter('all');
      });
    }

    // Scheme card click -> details modal
    if (this.grid) {
      this.grid.addEventListener('click', (e) => {
        const cardBtn = e.target.closest('.btn-scheme-details');
        const card = e.target.closest('.scheme-card');
        if (!cardBtn && !card) return;

        const schemeId = (cardBtn && cardBtn.dataset.schemeId) || (card && card.dataset.schemeId);
        if (schemeId) {
          const scheme = SCHEMES.find(s => s.id === schemeId);
          if (scheme) {
            this.openSchemeModal(scheme);
          }
        }
      });
    }

    // Close modal via close button
    if (this.closeBtn && this.modalDetail) {
      this.closeBtn.addEventListener('click', () => {
        this.closeSchemeModal();
      });
    }

    // Close modal via overlay backdrop
    if (this.modalDetail) {
      this.modalDetail.addEventListener('click', (e) => {
        if (e.target === this.modalDetail) {
          this.closeSchemeModal();
        }
      });
    }

    // Close modal via Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalDetail && this.modalDetail.classList.contains('active')) {
        this.closeSchemeModal();
      }
    });
  }

  syncFilterPills(activeFilter) {
    if (!this.filterContainer) return;
    this.filterContainer.querySelectorAll('.filter-pill').forEach(pill => {
      if (pill.dataset.filter === activeFilter) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  }

  getFilteredSchemes() {
    const filter = state.schemesFilter || 'all';
    const query = this.searchInput ? this.searchInput.value.trim().toLowerCase() : '';

    return SCHEMES.filter(scheme => {
      // Filter matching
      let matchesFilter = true;
      if (filter === 'central') {
        matchesFilter = scheme.scope.toLowerCase().includes('central') && !scheme.scope.toLowerCase().includes('state');
      } else if (filter === 'state') {
        matchesFilter = scheme.scope.toLowerCase().includes('state');
      } else if (filter === 'crop') {
        matchesFilter = scheme.category === 'Insurance' || scheme.category === 'Income Support' || scheme.categoryLabel.toLowerCase().includes('crop');
      } else if (filter === 'irrigation') {
        matchesFilter = scheme.category === 'Irrigation' || scheme.title.toLowerCase().includes('sinchayee');
      } else if (filter === 'equipment') {
        matchesFilter = scheme.category === 'Equipment' || scheme.categoryLabel.toLowerCase().includes('machinery');
      } else if (filter === 'finance') {
        matchesFilter = scheme.category === 'Income Support' || scheme.categoryLabel.toLowerCase().includes('credit');
      }

      // Search query matching across title, objective, benefit, category, scope
      let matchesQuery = true;
      if (query) {
        const inTitle = scheme.title.toLowerCase().includes(query);
        const inObj = scheme.objective.toLowerCase().includes(query);
        const inBen = scheme.benefit.toLowerCase().includes(query);
        const inCat = scheme.category.toLowerCase().includes(query) || scheme.categoryLabel.toLowerCase().includes(query);
        const inScope = scheme.scope.toLowerCase().includes(query);
        const inElig = (scheme.eligibilitySummary || '').toLowerCase().includes(query);
        matchesQuery = inTitle || inObj || inBen || inCat || inScope || inElig;
      }

      return matchesFilter && matchesQuery;
    });
  }

  renderSchemes() {
    if (!this.grid) return;
    const list = this.getFilteredSchemes();

    // Update count badge
    if (this.countBadge) {
      this.countBadge.textContent = list.length;
    }

    // Toggle empty state
    if (list.length === 0) {
      this.grid.style.display = 'none';
      if (this.emptyState) this.emptyState.style.display = 'block';
      return;
    }

    this.grid.style.display = 'grid';
    if (this.emptyState) this.emptyState.style.display = 'none';

    this.grid.innerHTML = list.map(s => {
      const eligibilitySnippet = s.eligibilitySummary || (s.eligibility && s.eligibility[0]) || 'See details for complete criteria.';
      const updateLabel = s.lastUpdated || 'Current Active';

      return `
        <div class="scheme-card" data-scheme-id="${s.id}">
          <div class="scheme-card-top">
            <div class="scheme-badges-wrap">
              <span class="scheme-badge">${s.categoryLabel}</span>
              <span class="scheme-scope-badge">${s.scope}</span>
            </div>
          </div>
          
          <h3 class="scheme-card-title">${s.title}</h3>
          <p class="scheme-card-desc">${s.objective}</p>

          <div class="scheme-benefit-box">
            <div class="scheme-benefit-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span>Key Benefit:</span>
            </div>
            <div class="scheme-benefit-text">${s.benefit}</div>
          </div>

          <div class="scheme-eligibility-preview">
            <strong>Eligibility:</strong> ${eligibilitySnippet}
          </div>

          <div class="scheme-card-footer">
            <span class="scheme-card-update">${updateLabel}</span>
            <button class="btn-scheme-details" data-scheme-id="${s.id}" type="button" aria-label="View details for ${s.title}">
              <span>View Details</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  openSchemeModal(s) {
    if (!this.modalDetail || !this.modalBody) return;

    const eligibilityList = Array.isArray(s.eligibility) ? s.eligibility : [];
    const documentsList = Array.isArray(s.documents) ? s.documents : [];
    const appProcess = s.applicationProcess || 'Consult your local Krishi Vigyan Kendra (KVK) or block agriculture office for application assistance.';

    this.modalBody.innerHTML = `
      <div class="modal-scheme-header-badges">
        <span class="scheme-badge">${s.categoryLabel}</span>
        <span class="scheme-scope-badge">${s.scope}</span>
        <span class="scheme-scope-badge">${s.lastUpdated || 'Current Active'}</span>
      </div>

      <h4 class="modal-scheme-title">${s.title}</h4>
      <p class="modal-scheme-objective">${s.objective}</p>

      <div class="modal-scheme-benefit-box">
        <div class="modal-scheme-benefit-heading">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;" aria-hidden="true">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          <span>Financial / Subsidy Benefit</span>
        </div>
        <p class="modal-scheme-benefit-text">${s.benefit}</p>
      </div>

      <div class="modal-scheme-section">
        <h5 class="modal-scheme-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; color: var(--color-primary);" aria-hidden="true">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span>Eligibility Criteria</span>
        </h5>
        <ul class="modal-scheme-list">
          ${eligibilityList.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>

      <div class="modal-scheme-section">
        <h5 class="modal-scheme-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; color: var(--color-primary);" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <span>Required Documents</span>
        </h5>
        <ul class="modal-scheme-list">
          ${documentsList.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>

      <div class="modal-scheme-section">
        <h5 class="modal-scheme-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; color: var(--color-primary);" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>Application & Enrollment Process</span>
        </h5>
        <div class="modal-scheme-app-box">
          ${appProcess}
        </div>
      </div>

      <div class="modal-scheme-disclaimer" role="note">
        <strong>DISCLAIMER:</strong> Scheme guidelines, allocation quotas, and deadlines are subject to government revisions. Always cross-check active criteria and circulars on the official government website before submitting documentation.
      </div>

      <div class="modal-scheme-actions">
        <button type="button" class="btn-scheme-modal-close" id="btn-scheme-modal-dismiss">Close</button>
        <a href="${s.officialUrl}" target="_blank" rel="noopener noreferrer" class="btn-scheme-portal" title="Opens ${s.officialUrl} in a new tab">
          <span>Visit Official Portal</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 15px; height: 15px;" aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>
    `;

    // Bind dismiss button inside modal body
    const dismissBtn = document.getElementById('btn-scheme-modal-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        this.closeSchemeModal();
      });
    }

    this.modalDetail.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus close button for accessibility
    if (this.closeBtn) {
      this.closeBtn.focus();
    }
  }

  closeSchemeModal() {
    if (!this.modalDetail) return;
    this.modalDetail.classList.remove('active');
    document.body.style.overflow = '';
  }
}
