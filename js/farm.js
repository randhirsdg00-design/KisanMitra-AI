/* =========================================================
   KisanMitra AI — My Farm Management Module
   ========================================================= */

import { state } from './state.js';

export class FarmManager {
  constructor() {
    // Containers & Elements
    this.cropsContainer = document.getElementById('farm-crops-container');
    this.emptyState = document.getElementById('farm-empty-state');
    this.cropsCountBadge = document.getElementById('crops-count-badge');

    // Summary Card Elements
    this.summaryLand = document.getElementById('farm-summary-land');
    this.summaryLandSub = document.getElementById('farm-summary-land-sub');
    this.summaryCrops = document.getElementById('farm-summary-crops');
    this.summaryCropsSub = document.getElementById('farm-summary-crops-sub');
    this.summarySeason = document.getElementById('farm-summary-season');
    this.summarySeasonSub = document.getElementById('farm-summary-season-sub');
    this.summaryStatus = document.getElementById('farm-summary-status');
    this.summaryStatusSub = document.getElementById('farm-summary-status-sub');

    // Add / Edit Modal & Form Elements
    this.modalCropForm = document.getElementById('modal-crop-form');
    this.formCrop = document.getElementById('form-crop');
    this.modalTitleText = document.getElementById('modal-crop-heading-text');
    this.btnCloseCropModal = document.getElementById('btn-close-crop-modal');
    this.btnCancelCrop = document.getElementById('btn-cancel-crop');
    this.btnSaveCrop = document.getElementById('btn-save-crop');
    this.cropEditId = document.getElementById('crop-edit-id');
    this.formErrorBanner = document.getElementById('crop-form-error');

    // Inputs
    this.inputName = document.getElementById('crop-input-name');
    this.inputVariety = document.getElementById('crop-input-variety');
    this.inputArea = document.getElementById('crop-input-area');
    this.inputUnit = document.getElementById('crop-input-unit');
    this.inputSeason = document.getElementById('crop-input-season');
    this.inputDate = document.getElementById('crop-input-date');
    this.inputStatus = document.getElementById('crop-input-status');
    this.inputHealth = document.getElementById('crop-input-health');
    this.inputNotes = document.getElementById('crop-input-notes');
    this.nameErrorMsg = document.getElementById('crop-name-error');
    this.areaErrorMsg = document.getElementById('crop-area-error');

    // Delete Modal Elements
    this.modalDeleteCrop = document.getElementById('modal-delete-crop');
    this.deleteCropSummary = document.getElementById('delete-crop-summary');
    this.btnCancelDelete = document.getElementById('btn-cancel-delete');
    this.btnConfirmDelete = document.getElementById('btn-confirm-delete');
    this.pendingDeleteId = null;

    // Trigger Buttons
    this.btnAddCrop = document.getElementById('btn-add-crop');
    this.btnLinkAddCrop = document.getElementById('btn-link-add-crop');
    this.btnEmptyAddCrop = document.getElementById('btn-empty-add-crop');

    this.init();
  }

  init() {
    this.renderFarm();
    this.bindEvents();

    // Reactive subscription to state updates
    state.subscribe((event) => {
      if (event === 'plotsUpdated') {
        this.renderFarm();
      }
    });
  }

  bindEvents() {
    // Open Add Crop Modal
    const openAddHandler = () => this.openAddModal();
    if (this.btnAddCrop) this.btnAddCrop.addEventListener('click', openAddHandler);
    if (this.btnLinkAddCrop) this.btnLinkAddCrop.addEventListener('click', openAddHandler);
    if (this.btnEmptyAddCrop) this.btnEmptyAddCrop.addEventListener('click', openAddHandler);

    // Close Add/Edit Modal
    if (this.btnCloseCropModal) {
      this.btnCloseCropModal.addEventListener('click', () => this.closeCropModal());
    }
    if (this.btnCancelCrop) {
      this.btnCancelCrop.addEventListener('click', () => this.closeCropModal());
    }

    // Modal Backdrop click to close
    if (this.modalCropForm) {
      this.modalCropForm.addEventListener('click', (e) => {
        if (e.target === this.modalCropForm) this.closeCropModal();
      });
    }

    // Delete Modal controls
    if (this.btnCancelDelete) {
      this.btnCancelDelete.addEventListener('click', () => this.closeDeleteModal());
    }
    if (this.btnConfirmDelete) {
      this.btnConfirmDelete.addEventListener('click', () => this.confirmDeleteCrop());
    }
    if (this.modalDeleteCrop) {
      this.modalDeleteCrop.addEventListener('click', (e) => {
        if (e.target === this.modalDeleteCrop) this.closeDeleteModal();
      });
    }

    // Escape Key listener for all farm modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.modalCropForm && this.modalCropForm.classList.contains('active')) {
          this.closeCropModal();
        }
        if (this.modalDeleteCrop && this.modalDeleteCrop.classList.contains('active')) {
          this.closeDeleteModal();
        }
      }
    });

    // Form submission (Add or Edit)
    if (this.formCrop) {
      this.formCrop.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }
  }

  /* =========================================================
     RENDER MY FARM: Summary Cards + Crop Cards
     ========================================================= */
  renderFarm() {
    const plots = state.farmPlots || [];
    this.updateSummary(plots);

    if (this.cropsCountBadge) {
      this.cropsCountBadge.textContent = plots.length;
    }

    // Empty state handling
    if (plots.length === 0) {
      if (this.emptyState) this.emptyState.style.display = 'block';
      if (this.cropsContainer) this.cropsContainer.innerHTML = '';
      return;
    }

    if (this.emptyState) this.emptyState.style.display = 'none';
    if (!this.cropsContainer) return;

    this.cropsContainer.innerHTML = plots.map(plot => this.renderCropCard(plot)).join('');

    // Bind Edit & Delete buttons on each card
    this.cropsContainer.querySelectorAll('.btn-crop-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.plotId;
        this.openEditModal(id);
      });
    });

    this.cropsContainer.querySelectorAll('.btn-crop-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.plotId;
        this.openDeleteConfirmation(id);
      });
    });
  }

  /* =========================================================
     SUMMARY METRICS CALCULATION
     ========================================================= */
  updateSummary(plots) {
    if (plots.length === 0) {
      if (this.summaryLand) this.summaryLand.textContent = '0 Acres';
      if (this.summaryLandSub) this.summaryLandSub.textContent = 'No land recorded';
      if (this.summaryCrops) this.summaryCrops.textContent = '0 Crops';
      if (this.summaryCropsSub) this.summaryCropsSub.textContent = 'No active crops';
      if (this.summarySeason) this.summarySeason.textContent = 'None';
      if (this.summarySeasonSub) this.summarySeasonSub.textContent = 'Awaiting planting';
      if (this.summaryStatus) this.summaryStatus.textContent = 'Idle';
      if (this.summaryStatusSub) this.summaryStatusSub.textContent = 'Ready to add crops';
      return;
    }

    // 1. Total Land Calculation
    let totalAcres = 0;
    plots.forEach(plot => {
      let val = 0;
      if (typeof plot.area === 'number') {
        val = plot.area;
      } else if (typeof plot.area === 'string') {
        const match = plot.area.match(/([\d.]+)/);
        if (match) val = parseFloat(match[1]);
      }
      totalAcres += val;
    });
    const roundedAcres = Math.round(totalAcres * 10) / 10;
    if (this.summaryLand) this.summaryLand.textContent = `${roundedAcres} Acres`;
    if (this.summaryLandSub) this.summaryLandSub.textContent = `${plots.length} plot${plots.length > 1 ? 's' : ''} in cultivation`;

    // 2. Active Crops Count
    const uniqueCrops = new Set(plots.map(p => (p.crop || '').trim()).filter(Boolean));
    if (this.summaryCrops) {
      this.summaryCrops.textContent = `${plots.length} Crop${plots.length > 1 ? 's' : ''}`;
    }
    if (this.summaryCropsSub) {
      this.summaryCropsSub.textContent = `${uniqueCrops.size} unique variet${uniqueCrops.size === 1 ? 'y' : 'ies'}`;
    }

    // 3. Current Season
    const seasons = plots.map(p => p.season).filter(Boolean);
    const primarySeason = seasons.length > 0 ? seasons[0] : 'Rabi';
    if (this.summarySeason) this.summarySeason.textContent = primarySeason;
    if (this.summarySeasonSub) {
      this.summarySeasonSub.textContent = primarySeason === 'Rabi' ? 'Winter cycle' : primarySeason === 'Kharif' ? 'Monsoon cycle' : 'Active season';
    }

    // 4. Farm Status
    const hasAlert = plots.some(p => (p.health || '').toLowerCase().includes('alert'));
    if (this.summaryStatus) {
      this.summaryStatus.textContent = hasAlert ? 'Needs Attention' : 'Optimal';
    }
    if (this.summaryStatusSub) {
      this.summaryStatusSub.textContent = hasAlert ? '1+ crop alerts noted' : 'All crops healthy';
    }
  }

  /* =========================================================
     CROP CARD HTML BUILDER
     ========================================================= */
  renderCropCard(plot) {
    const cropName = plot.crop || plot.name || 'Crop';
    const variety = plot.variety ? plot.variety : (plot.name && plot.name !== plot.crop ? plot.name : '');
    const areaDisplay = typeof plot.area === 'number' ? `${plot.area} ${plot.unit || 'Acres'}` : plot.area || '—';
    const seasonDisplay = plot.season || 'Rabi';
    const dateDisplay = plot.sownDateDisplay || plot.sownDate || 'Recent';
    const statusDisplay = plot.status || plot.stage || 'Growing';
    const healthText = plot.health || 'Healthy (Normal)';

    let healthClass = 'healthy';
    if (healthText.toLowerCase().includes('alert') || healthText.toLowerCase().includes('blight')) {
      healthClass = 'alert';
    } else if (healthText.toLowerCase().includes('moderate') || healthText.toLowerCase().includes('warning')) {
      healthClass = 'warning';
    }

    const emoji = this.getCropEmoji(cropName);

    return `
      <div class="farm-crop-card" id="card-${plot.id}">
        <div class="crop-card-top">
          <!-- Card Header -->
          <div class="crop-card-header">
            <div class="crop-name-wrap">
              <span class="crop-emoji-icon" aria-hidden="true">${emoji}</span>
              <div>
                <h3 class="crop-card-title">${this.escapeHtml(cropName)}</h3>
                ${variety ? `<div class="crop-card-variety">${this.escapeHtml(variety)}</div>` : ''}
              </div>
            </div>
            <span class="crop-health-pill ${healthClass}">
              ● ${this.escapeHtml(healthText)}
            </span>
          </div>

          <!-- Structured Metadata 2x2 Table -->
          <div class="crop-meta-table">
            <div class="crop-meta-row">
              <span class="crop-meta-k">Area</span>
              <span class="crop-meta-v">${this.escapeHtml(areaDisplay)}</span>
            </div>
            <div class="crop-meta-row">
              <span class="crop-meta-k">Season</span>
              <span class="crop-meta-v">${this.escapeHtml(seasonDisplay)}</span>
            </div>
            <div class="crop-meta-row">
              <span class="crop-meta-k">Planting Date</span>
              <span class="crop-meta-v">${this.escapeHtml(dateDisplay)}</span>
            </div>
            <div class="crop-meta-row">
              <span class="crop-meta-k">Current Status</span>
              <span class="crop-meta-v">${this.escapeHtml(statusDisplay)}</span>
            </div>
          </div>

          <!-- Notes (If available) -->
          ${plot.notes ? `
            <div class="crop-notes-preview">
              📝 ${this.escapeHtml(plot.notes)}
            </div>
          ` : ''}
        </div>

        <!-- Action Buttons -->
        <div class="crop-card-actions">
          <button type="button" class="btn-crop-action btn-crop-edit" data-plot-id="${plot.id}" aria-label="Edit ${this.escapeHtml(cropName)} details">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span>Edit</span>
          </button>
          <button type="button" class="btn-crop-action btn-crop-delete" data-plot-id="${plot.id}" aria-label="Remove ${this.escapeHtml(cropName)} from farm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            <span>Remove</span>
          </button>
        </div>
      </div>
    `;
  }

  getCropEmoji(name = '') {
    const n = name.toLowerCase();
    if (n.includes('wheat')) return '🌾';
    if (n.includes('tomato')) return '🍅';
    if (n.includes('paddy') || n.includes('rice')) return '🌾';
    if (n.includes('cotton')) return '🌿';
    if (n.includes('potato')) return '🥔';
    if (n.includes('mustard')) return '🌼';
    if (n.includes('onion')) return '🧅';
    if (n.includes('corn') || n.includes('maize')) return '🌽';
    return '🌱';
  }

  /* =========================================================
     ADD / EDIT MODAL WORKFLOWS
     ========================================================= */
  openAddModal() {
    this.resetForm();
    if (this.cropEditId) this.cropEditId.value = '';
    if (this.modalTitleText) this.modalTitleText.textContent = 'Add Crop';
    if (this.btnSaveCrop) this.btnSaveCrop.textContent = 'Save Crop';

    // Set today as default date
    if (this.inputDate && !this.inputDate.value) {
      this.inputDate.value = new Date().toISOString().split('T')[0];
    }

    if (this.modalCropForm) {
      this.modalCropForm.classList.add('active');
      setTimeout(() => {
        if (this.inputName) this.inputName.focus();
      }, 50);
    }
  }

  openEditModal(plotId) {
    const plot = (state.farmPlots || []).find(p => p.id === plotId);
    if (!plot) return;

    this.resetForm();
    if (this.cropEditId) this.cropEditId.value = plot.id;
    if (this.modalTitleText) this.modalTitleText.textContent = 'Edit Crop';
    if (this.btnSaveCrop) this.btnSaveCrop.textContent = 'Update Crop';

    if (this.inputName) this.inputName.value = plot.crop || plot.name || '';
    if (this.inputVariety) this.inputVariety.value = plot.variety || '';

    // Area numeric extraction
    let numericArea = '';
    if (typeof plot.area === 'number') {
      numericArea = plot.area;
    } else if (typeof plot.area === 'string') {
      const match = plot.area.match(/([\d.]+)/);
      if (match) numericArea = match[1];
    }
    if (this.inputArea) this.inputArea.value = numericArea;

    if (this.inputUnit) this.inputUnit.value = plot.unit || 'Acres';
    if (this.inputSeason) this.inputSeason.value = plot.season || 'Rabi';
    if (this.inputDate) this.inputDate.value = plot.sownDate || '';
    if (this.inputStatus) this.inputStatus.value = plot.status || plot.stage || 'Growing';
    if (this.inputHealth) this.inputHealth.value = plot.health || 'Healthy (Optimal)';
    if (this.inputNotes) this.inputNotes.value = plot.notes || '';

    if (this.modalCropForm) {
      this.modalCropForm.classList.add('active');
      setTimeout(() => {
        if (this.inputName) this.inputName.focus();
      }, 50);
    }
  }

  closeCropModal() {
    if (this.modalCropForm) {
      this.modalCropForm.classList.remove('active');
    }
    this.resetForm();
  }

  resetForm() {
    if (this.formCrop) this.formCrop.reset();
    if (this.formErrorBanner) this.formErrorBanner.style.display = 'none';
    if (this.nameErrorMsg) this.nameErrorMsg.textContent = '';
    if (this.areaErrorMsg) this.areaErrorMsg.textContent = '';
    if (this.inputName) this.inputName.classList.remove('input-invalid');
    if (this.inputArea) this.inputArea.classList.remove('input-invalid');
  }

  /* =========================================================
     VALIDATION & FORM SUBMISSION
     ========================================================= */
  handleFormSubmit() {
    let isValid = true;
    this.resetErrors();

    // 1. Validate Crop Name
    const cropName = (this.inputName ? this.inputName.value : '').trim();
    if (!cropName) {
      isValid = false;
      if (this.inputName) this.inputName.classList.add('input-invalid');
      if (this.nameErrorMsg) this.nameErrorMsg.textContent = 'Crop name is required.';
    }

    // 2. Validate Area (must be positive number)
    const areaRaw = this.inputArea ? this.inputArea.value : '';
    const areaNum = parseFloat(areaRaw);
    if (!areaRaw || isNaN(areaNum) || areaNum <= 0) {
      isValid = false;
      if (this.inputArea) this.inputArea.classList.add('input-invalid');
      if (this.areaErrorMsg) this.areaErrorMsg.textContent = 'Please enter a valid positive area.';
    }

    if (!isValid) {
      if (this.formErrorBanner) this.formErrorBanner.style.display = 'flex';
      return;
    }

    const editId = this.cropEditId ? this.cropEditId.value.trim() : '';
    const variety = this.inputVariety ? this.inputVariety.value.trim() : '';
    const unit = this.inputUnit ? this.inputUnit.value : 'Acres';
    const season = this.inputSeason ? this.inputSeason.value : 'Rabi';
    const sownDate = this.inputDate ? this.inputDate.value : '';
    const status = this.inputStatus ? this.inputStatus.value : 'Growing';
    const health = this.inputHealth ? this.inputHealth.value : 'Healthy (Optimal)';
    const notes = this.inputNotes ? this.inputNotes.value.trim() : '';

    // Human-friendly date formatting
    let sownDateDisplay = 'Recently added';
    if (sownDate) {
      try {
        const d = new Date(sownDate);
        if (!isNaN(d.getTime())) {
          sownDateDisplay = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        }
      } catch (err) {
        sownDateDisplay = sownDate;
      }
    }

    if (editId) {
      // Update existing crop
      const updatedFields = {
        crop: cropName,
        name: variety ? `${cropName} (${variety})` : cropName,
        variety,
        area: areaNum,
        unit,
        season,
        sownDate,
        sownDateDisplay,
        status,
        stage: status,
        health,
        notes
      };
      state.updatePlot(editId, updatedFields);
      this.closeCropModal();
      this.showToast(`🌾 Updated ${cropName} successfully.`);
    } else {
      // Add new crop
      const newPlot = {
        id: 'plot-' + Date.now(),
        name: variety ? `${cropName} (${variety})` : cropName,
        crop: cropName,
        variety,
        area: areaNum,
        unit,
        season,
        sownDate: sownDate || new Date().toISOString().split('T')[0],
        sownDateDisplay,
        status,
        stage: status,
        health,
        notes,
        progress: 25,
        moisture: '60% (Optimal)',
        soil: 'Loam'
      };
      state.addPlot(newPlot);
      this.closeCropModal();
      this.showToast(`🌱 Added ${cropName} to your farm.`);
    }
  }

  resetErrors() {
    if (this.formErrorBanner) this.formErrorBanner.style.display = 'none';
    if (this.nameErrorMsg) this.nameErrorMsg.textContent = '';
    if (this.areaErrorMsg) this.areaErrorMsg.textContent = '';
    if (this.inputName) this.inputName.classList.remove('input-invalid');
    if (this.inputArea) this.inputArea.classList.remove('input-invalid');
  }

  /* =========================================================
     DELETE CONFIRMATION WORKFLOW
     ========================================================= */
  openDeleteConfirmation(plotId) {
    const plot = (state.farmPlots || []).find(p => p.id === plotId);
    if (!plot) return;

    this.pendingDeleteId = plotId;
    const cropName = plot.crop || plot.name || 'Crop';
    const areaDisplay = typeof plot.area === 'number' ? `${plot.area} ${plot.unit || 'Acres'}` : plot.area || '';

    if (this.deleteCropSummary) {
      this.deleteCropSummary.textContent = `${cropName} (${areaDisplay})`;
    }

    if (this.modalDeleteCrop) {
      this.modalDeleteCrop.classList.add('active');
      setTimeout(() => {
        if (this.btnCancelDelete) this.btnCancelDelete.focus();
      }, 50);
    }
  }

  confirmDeleteCrop() {
    if (!this.pendingDeleteId) return;
    const targetPlot = (state.farmPlots || []).find(p => p.id === this.pendingDeleteId);
    const cropName = targetPlot ? (targetPlot.crop || targetPlot.name) : 'Crop';

    state.deletePlot(this.pendingDeleteId);
    this.pendingDeleteId = null;
    this.closeDeleteModal();
    this.showToast(`🗑️ Removed ${cropName} from farm.`);
  }

  closeDeleteModal() {
    this.pendingDeleteId = null;
    if (this.modalDeleteCrop) {
      this.modalDeleteCrop.classList.remove('active');
    }
  }

  /* =========================================================
     UTILITY: Toast Notifications & HTML Escaping
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
