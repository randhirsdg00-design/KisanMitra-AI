/* =========================================================
   KisanMitra AI — Scan History & Diagnostics Archive
   Professional, Transparent Crop Analyses Archive
   ========================================================= */

import { state } from './state.js';

export class HistoryManager {
  constructor() {
    this.historyGrid = document.getElementById('history-grid');
    this.searchInput = document.getElementById('history-search-input');
    this.filterContainer = document.getElementById('history-filter-pills');
    this.countBadge = document.getElementById('history-count-badge');
    this.emptyState = document.getElementById('history-empty-state');
    this.emptyTitle = document.getElementById('history-empty-title');
    this.emptyDesc = document.getElementById('history-empty-desc');
    this.btnEmptyScan = document.getElementById('btn-history-empty-scan');

    // Delete Confirmation Modal Elements
    this.modalDeleteScan = document.getElementById('modal-delete-scan');
    this.deleteScanSummary = document.getElementById('delete-scan-summary');
    this.btnCancelDelete = document.getElementById('btn-cancel-delete-scan');
    this.btnConfirmDelete = document.getElementById('btn-confirm-delete-scan');
    this.pendingDeleteId = null;

    this.init();
  }

  init() {
    this.renderHistory();
    this.bindEvents();

    state.subscribe((event) => {
      if (event === 'historyUpdated' || event === 'historyFilterChange') {
        this.renderHistory();
      }
    });
  }

  bindEvents() {
    // Filter Pills
    if (this.filterContainer) {
      this.filterContainer.addEventListener('click', (e) => {
        const pill = e.target.closest('.filter-pill');
        if (!pill) return;
        this.filterContainer.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const filter = pill.dataset.filter || 'all';
        state.setHistoryFilter(filter);
      });
    }

    // Live Search Input (Debounced)
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => {
        this.renderHistory();
      });
    }

    // Empty State Button -> Navigate to Scan Crop
    if (this.btnEmptyScan) {
      this.btnEmptyScan.addEventListener('click', () => {
        if (!state.isAuthenticated) {
          state.postLoginRedirect = 'scan';
          state.loginNotice = 'Please log in to scan your crop. Your account helps keep your crop analysis linked to your session.';
          state.setView('login');
          return;
        }
        if (window.app && window.app.scanner) {
          window.app.scanner.resetScanFlow();
        }
        state.setTab('scan');
      });
    }

    // Delete Modal controls
    if (this.btnCancelDelete) {
      this.btnCancelDelete.addEventListener('click', () => this.closeDeleteModal());
    }
    if (this.btnConfirmDelete) {
      this.btnConfirmDelete.addEventListener('click', () => this.confirmDeleteScan());
    }
    if (this.modalDeleteScan) {
      this.modalDeleteScan.addEventListener('click', (e) => {
        if (e.target === this.modalDeleteScan) this.closeDeleteModal();
      });
    }

    // Escape Key listener
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.modalDeleteScan && this.modalDeleteScan.classList.contains('active')) {
          this.closeDeleteModal();
        }
      }
    });
  }

  getFilteredScans() {
    const filter = state.historyFilter || 'all';
    const query = this.searchInput ? this.searchInput.value.trim().toLowerCase() : '';

    return (state.scansHistory || []).filter(scan => {
      // Severity filter mapping
      let matchesFilter = true;
      if (filter !== 'all') {
        matchesFilter = (scan.severity === filter);
      }

      // Query search mapping across crop, disease, pathogen, description
      let matchesQuery = true;
      if (query) {
        const cropText = (scan.crop || '').toLowerCase();
        const diseaseText = (scan.disease || '').toLowerCase();
        const pathogenText = (scan.pathogen || '').toLowerCase();
        const descText = (scan.description || '').toLowerCase();
        matchesQuery = cropText.includes(query) || diseaseText.includes(query) || pathogenText.includes(query) || descText.includes(query);
      }

      return matchesFilter && matchesQuery;
    });
  }

  renderHistory() {
    const scans = this.getFilteredScans();
    const totalStored = (state.scansHistory || []).length;

    // Update count badge
    if (this.countBadge) {
      this.countBadge.textContent = scans.length;
    }

    // Handle Empty States
    if (scans.length === 0) {
      if (this.historyGrid) this.historyGrid.innerHTML = '';
      if (this.emptyState) {
        this.emptyState.style.display = 'block';
        if (totalStored === 0) {
          if (this.emptyTitle) this.emptyTitle.textContent = 'No crop analyses yet';
          if (this.emptyDesc) this.emptyDesc.textContent = 'Your saved crop analyses will appear here.';
        } else {
          if (this.emptyTitle) this.emptyTitle.textContent = 'No matching analyses found';
          if (this.emptyDesc) this.emptyDesc.textContent = 'Try adjusting your search terms or filter selection.';
        }
      }
      return;
    }

    // Non-empty state
    if (this.emptyState) this.emptyState.style.display = 'none';
    if (!this.historyGrid) return;

    this.historyGrid.innerHTML = scans.map(scan => this.renderHistoryCard(scan)).join('');

    // Bind card action buttons
    this.historyGrid.querySelectorAll('.btn-history-view-result').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const scanId = btn.dataset.scanId;
        this.viewScanResult(scanId);
      });
    });

    this.historyGrid.querySelectorAll('.btn-history-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const scanId = btn.dataset.scanId;
        this.openDeleteConfirmation(scanId);
      });
    });

    // Make entire card clickable for View Result as a convenience
    this.historyGrid.querySelectorAll('.history-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-history-delete')) return;
        const scanId = card.dataset.scanId;
        this.viewScanResult(scanId);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target.closest('.btn-history-delete')) return;
          e.preventDefault();
          const scanId = card.dataset.scanId;
          this.viewScanResult(scanId);
        }
      });
    });
  }

  renderHistoryCard(scan) {
    const cropName = scan.crop || 'Crop';
    const subTitle = scan.cropScientific ? scan.cropScientific : (scan.pathogen ? `Pathogen: ${scan.pathogen}` : 'Crop analysis');
    const dateStamp = scan.date || 'Recent';
    const diseaseName = scan.disease || 'General Crop Inspection';
    const severity = scan.severity || 'completed';
    const severityLabel = scan.severityLabel || (severity === 'severe' ? 'Severe Infection' : severity === 'warning' ? 'Moderate Concern' : 'Healthy Crop');
    const description = scan.description || 'Crop foliage analysis archive record.';
    const imgSrc = scan.image || 'assets/samples/tomato_early_blight.jpg';

    return `
      <div class="history-card" data-scan-id="${scan.id}" role="listitem" tabindex="0" aria-label="${this.escapeHtml(cropName)} analysis on ${this.escapeHtml(dateStamp)}">
        <!-- Thumbnail Wrap with DEMO Tag -->
        <div class="history-card-img-wrap">
          <img src="${imgSrc}" alt="${this.escapeHtml(cropName)} leaf" class="history-card-img" loading="lazy">
          <span class="history-card-demo-tag">DEMO</span>
        </div>

        <!-- Card Body -->
        <div class="history-card-body">
          <div class="history-card-top-row">
            <div>
              <h3 class="history-crop-title">${this.escapeHtml(cropName)}</h3>
              <div class="history-crop-sub">${this.escapeHtml(subTitle)}</div>
            </div>
            <span class="history-date-stamp">${this.escapeHtml(dateStamp)}</span>
          </div>

          <!-- Disease & Severity -->
          <div class="history-disease-row">
            <span class="status-badge ${severity}">${this.escapeHtml(severityLabel)}</span>
            <span class="history-disease-text">${this.escapeHtml(diseaseName)}</span>
          </div>

          <!-- Description Preview -->
          <p class="history-desc-snippet">${this.escapeHtml(description)}</p>

          <!-- Actions -->
          <div class="history-card-actions">
            <button type="button" class="btn-history-view-result" data-scan-id="${scan.id}" aria-label="View diagnostic result for ${this.escapeHtml(cropName)}">
              <span>View Result</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
            <button type="button" class="btn-history-delete" data-scan-id="${scan.id}" title="Delete scan record" aria-label="Delete analysis record for ${this.escapeHtml(cropName)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /* =========================================================
     VIEW RESULT WORKFLOW: Seamless Scan Result Reuse
     ========================================================= */
  viewScanResult(scanId) {
    const scan = (state.scansHistory || []).find(s => s.id === scanId);
    if (!scan) return;

    // Build context for CropScanner.renderScanResult
    const ctx = {
      cropName: `${scan.crop} leaf`,
      dataUrl: scan.image,
      specs: scan.specs || '0.8 MB · JPG',
      sampleData: scan,
      isSample: true,
      timestamp: scan.date || 'Archived Analysis'
    };

    if (window.app && window.app.scanner) {
      window.app.scanner.currentScanContext = ctx;
      window.app.scanner.previousTab = 'history';
      window.app.scanner.renderScanResult(ctx);

      // Update back button label on scan result screen to say "Back to History"
      const backBtn = document.getElementById('btn-result-back-scan');
      if (backBtn) {
        const span = backBtn.querySelector('span');
        if (span) span.textContent = 'Back to History';
      }
    }

    state.setTab('scan-result');
  }

  /* =========================================================
     DELETE WORKFLOW: Confirmation Modal & Safe Removal
     ========================================================= */
  openDeleteConfirmation(scanId) {
    const scan = (state.scansHistory || []).find(s => s.id === scanId);
    if (!scan) return;

    this.pendingDeleteId = scanId;
    const cropName = scan.crop || 'Crop';
    const diseaseName = scan.disease || 'Inspection';
    const dateStamp = scan.date || 'Recent';

    if (this.deleteScanSummary) {
      this.deleteScanSummary.textContent = `${cropName} — ${diseaseName} (${dateStamp})`;
    }

    if (this.modalDeleteScan) {
      this.modalDeleteScan.classList.add('active');
      setTimeout(() => {
        if (this.btnCancelDelete) this.btnCancelDelete.focus();
      }, 50);
    }
  }

  confirmDeleteScan() {
    if (!this.pendingDeleteId) return;
    const targetScan = (state.scansHistory || []).find(s => s.id === this.pendingDeleteId);
    const cropName = targetScan ? targetScan.crop : 'Crop';

    state.deleteScanFromHistory(this.pendingDeleteId);
    this.pendingDeleteId = null;
    this.closeDeleteModal();
    this.showToast(`🗑️ Removed ${cropName} analysis from history.`);
  }

  closeDeleteModal() {
    this.pendingDeleteId = null;
    if (this.modalDeleteScan) {
      this.modalDeleteScan.classList.remove('active');
    }
  }

  /* =========================================================
     UTILITY: Toast & HTML Escaping
     ========================================================= */
  showToast(msg) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  escapeHtml(str) {
    if (typeof str !== 'string') return String(str || '');
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

