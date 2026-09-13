/* =========================================================
   KisanMitra AI — Scan Page Controller & AI Crop Scanner
   Professional Agricultural Image Input, Validation, Analysis & Result Flow
   ========================================================= */

import { state } from './state.js';
import { SAMPLES } from './data.js';

export class CropScanner {
  constructor() {
    // Scan Page Elements
    this.scanPage = document.getElementById('tab-scan');
    this.btnBackHome = document.getElementById('btn-scan-back-home');
    this.uploadCard = document.getElementById('scan-upload-card');
    this.btnTakePhoto = document.getElementById('btn-take-photo');
    this.btnUploadGallery = document.getElementById('btn-upload-gallery');
    this.cameraInput = document.getElementById('scan-camera-input');
    this.galleryInput = document.getElementById('scan-gallery-input');
    this.desktopDropzone = document.getElementById('desktop-dropzone');
    
    // Error Alert Elements on Scan Page
    this.errorCard = document.getElementById('scan-error-card');
    this.errorTitle = document.getElementById('scan-error-title');
    this.errorDesc = document.getElementById('scan-error-desc');
    this.btnCloseError = document.getElementById('btn-close-scan-error');

    // Photo Preview Elements on Scan Page
    this.previewCard = document.getElementById('scan-preview-card');
    this.previewImg = document.getElementById('preview-img');
    this.previewCrop = document.getElementById('preview-meta-crop');
    this.previewSpecs = document.getElementById('preview-meta-specs');
    this.btnChooseAnother = document.getElementById('btn-choose-another');
    this.btnAnalyzeCrop = document.getElementById('btn-analyze-crop');

    // Analyzing State Elements on Scan Page
    this.analyzingCard = document.getElementById('scan-analyzing-card');
    this.step1 = document.getElementById('step-1');
    this.step2 = document.getElementById('step-2');
    this.step3 = document.getElementById('step-3');
    this.analyzingCompleteBox = document.getElementById('analyzing-complete-box');
    this.btnScanReset = document.getElementById('btn-scan-reset');
    this.btnViewScanResult = document.getElementById('btn-view-scan-result');

    // Demo samples
    this.demoChips = document.querySelectorAll('.demo-chip');

    // Scan Result Screen Elements (#tab-scan-result)
    this.tabScanResult = document.getElementById('tab-scan-result');
    this.btnResultBackScan = document.getElementById('btn-result-back-scan');
    this.btnResultNavHome = document.getElementById('btn-result-nav-home');
    this.resultModeBadge = document.getElementById('result-mode-badge');
    this.resultModeText = document.getElementById('result-mode-text');

    // Result Error State
    this.resultErrorCard = document.getElementById('result-error-card');
    this.resultErrorTitle = document.getElementById('result-error-title');
    this.resultErrorDesc = document.getElementById('result-error-desc');
    this.btnResultErrorRetry = document.getElementById('btn-result-error-retry');
    this.btnResultErrorScanAnother = document.getElementById('btn-result-error-scan-another');

    // Result Photo Card Elements
    this.resultCropImg = document.getElementById('result-crop-img');
    this.resultPhotoCropName = document.getElementById('result-photo-crop-name');
    this.resultPhotoTimestamp = document.getElementById('result-photo-timestamp');
    this.resultPhotoSpecs = document.getElementById('result-photo-specs');
    this.resultPhotoStatus = document.getElementById('result-photo-status');

    // Result Notice Box
    this.resultDemoNoticeBox = document.getElementById('result-demo-notice-box');
    this.resultNoticeHeading = document.getElementById('result-notice-heading');
    this.resultNoticeMessage = document.getElementById('result-notice-message');

    // Result Diagnostics Cards
    this.resultDiseaseName = document.getElementById('result-disease-name');
    this.resultPathogenName = document.getElementById('result-pathogen-name');
    this.resultConfidenceVal = document.getElementById('result-confidence-val');
    this.resultSeverityVal = document.getElementById('result-severity-val');
    this.resultDiseaseDesc = document.getElementById('result-disease-desc');
    this.resultSymptomsList = document.getElementById('result-symptoms-list');
    this.resultOrganicBox = document.getElementById('result-organic-box');
    this.resultOrganicList = document.getElementById('result-organic-list');
    this.resultChemicalBox = document.getElementById('result-chemical-box');
    this.resultChemicalList = document.getElementById('result-chemical-list');
    this.resultPreventionList = document.getElementById('result-prevention-list');

    // Result Actions
    this.btnResultScanAgain = document.getElementById('btn-result-scan-again');
    this.btnResultAskMitra = document.getElementById('btn-result-ask-mitra');
    this.btnResultSaveHistory = document.getElementById('btn-result-save-history');
    this.btnSaveHistoryLabel = document.getElementById('btn-save-history-label');

    // Current State
    this.currentFile = null;
    this.currentDataUrl = null;
    this.currentCropName = 'Tomato leaf';
    this.currentSpecs = '0.8 MB · JPG';
    this.currentSampleId = 'sample-tomato';
    this.currentScanContext = null;
    this.analysisTimer = null;

    this.init();
  }

  init() {
    this.bindNavigation();
    this.bindInputs();
    this.bindDragAndDrop();
    this.bindPreviewActions();
    this.bindDemoSamples();
    this.bindResultActions();
  }

  bindNavigation() {
    // "← Back to Home" button on Scan page
    if (this.btnBackHome) {
      this.btnBackHome.addEventListener('click', (e) => {
        e.preventDefault();
        this.resetScanFlow();
        state.setTab('home');
      });
    }

    if (this.btnScanReset) {
      this.btnScanReset.addEventListener('click', () => {
        this.resetScanFlow();
      });
    }
  }

  checkAuthOrRedirect(sampleId = null) {
    if (!state.isAuthenticated) {
      state.postLoginRedirect = 'scan';
      state.pendingSampleId = sampleId;
      state.loginNotice = 'Please log in to scan your crop. Your account helps keep your crop analysis linked to your session.';
      state.setView('login');
      return false;
    }
    return true;
  }

  bindInputs() {
    // Primary: [ Take Photo ] -> triggers camera input (capture="environment")
    if (this.btnTakePhoto && this.cameraInput) {
      this.btnTakePhoto.addEventListener('click', () => {
        if (!this.checkAuthOrRedirect()) return;
        this.clearError();
        this.cameraInput.click();
      });

      this.cameraInput.addEventListener('change', (e) => {
        if (!this.checkAuthOrRedirect()) return;
        if (e.target.files && e.target.files[0]) {
          this.handleFileSelected(e.target.files[0]);
        }
      });
    }

    // Secondary: [ Upload from Gallery ] -> triggers gallery input
    if (this.btnUploadGallery && this.galleryInput) {
      this.btnUploadGallery.addEventListener('click', () => {
        if (!this.checkAuthOrRedirect()) return;
        this.clearError();
        this.galleryInput.click();
      });

      this.galleryInput.addEventListener('change', (e) => {
        if (!this.checkAuthOrRedirect()) return;
        if (e.target.files && e.target.files[0]) {
          this.handleFileSelected(e.target.files[0]);
        }
      });
    }

    // Dismiss Error on Scan Page
    if (this.btnCloseError) {
      this.btnCloseError.addEventListener('click', () => {
        this.clearError();
      });
    }
  }

  bindDragAndDrop() {
    if (!this.desktopDropzone) return;

    this.desktopDropzone.addEventListener('click', () => {
      if (!this.checkAuthOrRedirect()) return;
      this.clearError();
      if (this.galleryInput) this.galleryInput.click();
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      this.desktopDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.desktopDropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      this.desktopDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.desktopDropzone.classList.remove('dragover');
      });
    });

    this.desktopDropzone.addEventListener('drop', (e) => {
      if (!this.checkAuthOrRedirect()) return;
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.handleFileSelected(e.dataTransfer.files[0]);
      }
    });
  }

  bindPreviewActions() {
    // [ Choose Another ]
    if (this.btnChooseAnother) {
      this.btnChooseAnother.addEventListener('click', () => {
        this.resetToUpload();
      });
    }

    // [ Analyze Crop ] Primary CTA
    if (this.btnAnalyzeCrop) {
      this.btnAnalyzeCrop.addEventListener('click', () => {
        this.startAnalysis();
      });
    }
  }

  bindDemoSamples() {
    if (!this.demoChips) return;
    this.demoChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const cropName = chip.dataset.crop || 'Crop leaf';
        const src = chip.dataset.src;
        const sizeBytes = parseInt(chip.dataset.size || '800000', 10);
        
        let sampleId = chip.dataset.sampleId;
        if (!sampleId) {
          const lower = cropName.toLowerCase();
          if (lower.includes('tomato')) sampleId = 'sample-tomato';
          else if (lower.includes('wheat')) sampleId = 'sample-wheat';
          else if (lower.includes('potato')) sampleId = 'sample-potato';
          else if (lower.includes('cotton')) sampleId = 'sample-cotton';
        }

        if (!this.checkAuthOrRedirect(sampleId)) return;

        this.clearError();
        this.currentCropName = cropName;
        this.currentDataUrl = src;
        this.currentSampleId = sampleId;
        
        const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(1);
        const specs = `${sizeMb} MB · JPG`;
        this.currentSpecs = specs;
        this.showPreview(src, cropName, specs, sampleId);
      });
    });
  }

  bindResultActions() {
    // View Result CTA on analyzing complete box
    if (this.btnViewScanResult) {
      this.btnViewScanResult.addEventListener('click', () => {
        this.showResultScreen();
      });
    }

    // Navigation: Back to Scan / History
    if (this.btnResultBackScan) {
      this.btnResultBackScan.addEventListener('click', () => {
        const dest = this.previousTab || 'scan';
        this.previousTab = null;
        this.resetScanFlow();
        state.setTab(dest);
      });
    }

    // Navigation: Back to Home
    if (this.btnResultNavHome) {
      this.btnResultNavHome.addEventListener('click', () => {
        this.resetScanFlow();
        state.setTab('home');
      });
    }

    // Primary CTA: Scan Again
    if (this.btnResultScanAgain) {
      this.btnResultScanAgain.addEventListener('click', () => {
        this.resetScanFlow();
        state.setTab('scan');
      });
    }

    // Secondary CTA: Ask AI Mitra with contextual crop diagnosis
    if (this.btnResultAskMitra) {
      this.btnResultAskMitra.addEventListener('click', () => {
        const cropName = this.currentScanContext ? this.currentScanContext.cropName : 'Crop leaf';
        const disease = (this.currentScanContext && this.currentScanContext.sampleData) ? this.currentScanContext.sampleData.disease : 'observed symptoms';
        const prompt = `How to manage and treat ${disease} in ${cropName}?`;
        if (window.app && window.app.chat) {
          window.app.chat.openWithContext(`${cropName} · ${disease}`, prompt);
        } else {
          state.setTab('ai-mitra');
        }
      });
    }

    // Action: Save to History
    if (this.btnResultSaveHistory) {
      this.btnResultSaveHistory.addEventListener('click', () => {
        this.saveCurrentScanToHistory();
      });
    }

    // Error actions
    if (this.btnResultErrorRetry) {
      this.btnResultErrorRetry.addEventListener('click', () => {
        state.setTab('scan');
        this.startAnalysis();
      });
    }

    if (this.btnResultErrorScanAnother) {
      this.btnResultErrorScanAnother.addEventListener('click', () => {
        this.resetScanFlow();
        state.setTab('scan');
      });
    }
  }

  handleFileSelected(file) {
    this.clearError();

    // 1. Validate File Format (JPG, JPEG, PNG only)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const fileNameLower = file.name.toLowerCase();
    const hasValidExtension = fileNameLower.endsWith('.jpg') || 
                              fileNameLower.endsWith('.jpeg') || 
                              fileNameLower.endsWith('.png');

    if (!validTypes.includes(file.type) && !hasValidExtension) {
      this.showError(
        'Unsupported file',
        'Please upload a JPG or PNG image.'
      );
      this.resetFileInputs();
      return;
    }

    // 2. Validate File Size (Maximum 10 MB)
    const maxSizeBytes = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSizeBytes) {
      this.showError(
        'File too large',
        'Please choose an image smaller than 10 MB.'
      );
      this.resetFileInputs();
      return;
    }

    // 3. Validate for unusually corrupt or empty file (< 500 bytes)
    if (file.size < 500) {
      this.showError(
        'Poor image quality',
        'Try taking another photo with better lighting and a clearer view of the affected area.'
      );
      this.resetFileInputs();
      return;
    }

    this.currentFile = file;
    this.currentSampleId = null; // User photo, not a pre-indexed sample

    // Detect friendly crop label from file name or default
    let detectedCrop = 'Crop leaf sample';
    if (/tomato/i.test(file.name)) detectedCrop = 'Tomato leaf';
    else if (/wheat/i.test(file.name)) detectedCrop = 'Wheat leaf';
    else if (/potato/i.test(file.name)) detectedCrop = 'Potato leaf';
    else if (/cotton/i.test(file.name)) detectedCrop = 'Cotton leaf';
    else if (/rice|paddy/i.test(file.name)) detectedCrop = 'Paddy leaf';
    else if (/corn|maize/i.test(file.name)) detectedCrop = 'Maize leaf';
    this.currentCropName = detectedCrop;

    // Calculate human-readable size and format
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const format = fileNameLower.endsWith('.png') ? 'PNG' : 'JPG';
    const specsString = `${sizeMb} MB · ${format}`;
    this.currentSpecs = specsString;

    // Read image using FileReader
    const reader = new FileReader();
    reader.onload = (e) => {
      this.currentDataUrl = e.target.result;
      this.showPreview(this.currentDataUrl, detectedCrop, specsString, null);
    };
    reader.onerror = () => {
      this.showError(
        'Upload failed',
        "We couldn't upload your photo. Please try again."
      );
      this.resetFileInputs();
    };

    reader.readAsDataURL(file);
  }

  showPreview(imgSrc, cropName, specs, sampleId = null) {
    this.currentDataUrl = imgSrc;
    this.currentCropName = cropName;
    this.currentSpecs = specs;
    if (sampleId !== undefined) {
      this.currentSampleId = sampleId;
    }

    if (this.uploadCard) this.uploadCard.style.display = 'none';
    if (this.analyzingCard) this.analyzingCard.style.display = 'none';
    if (this.previewCard) {
      this.previewCard.style.display = 'block';
      if (this.previewImg) this.previewImg.src = imgSrc;
      if (this.previewCrop) this.previewCrop.textContent = cropName;
      if (this.previewSpecs) this.previewSpecs.textContent = specs;
      this.previewCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  resetToUpload() {
    if (this.uploadCard) this.uploadCard.style.display = 'block';
    if (this.previewCard) this.previewCard.style.display = 'none';
    if (this.analyzingCard) this.analyzingCard.style.display = 'none';
    this.clearError();
    this.resetFileInputs();
  }

  startAnalysis() {
    // Hide preview actions, show analyzing card
    if (this.previewCard) this.previewCard.style.display = 'none';
    if (this.uploadCard) this.uploadCard.style.display = 'none';
    if (this.analyzingCard) {
      this.analyzingCard.style.display = 'block';
      this.analyzingCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    if (this.analyzingCompleteBox) this.analyzingCompleteBox.style.display = 'none';

    // Reset step indicators
    this.setStepStatus(this.step1, 'active');
    this.setStepStatus(this.step2, 'pending');
    this.setStepStatus(this.step3, 'pending');

    // Simulate 3-step progress sequentially
    // Step 1: Preparing image (after 700ms)
    this.analysisTimer = setTimeout(() => {
      this.setStepStatus(this.step1, 'completed');
      this.setStepStatus(this.step2, 'active');

      // Step 2: Checking crop (after 800ms)
      this.analysisTimer = setTimeout(() => {
        this.setStepStatus(this.step2, 'completed');
        this.setStepStatus(this.step3, 'active');

        // Step 3: Analyzing visible symptoms (after 800ms)
        this.analysisTimer = setTimeout(() => {
          this.setStepStatus(this.step3, 'completed');

          if (this.analyzingCompleteBox) {
            this.analyzingCompleteBox.style.display = 'block';
            this.analyzingCompleteBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }

          // Smooth automatic transition to Scan Result Screen
          this.analysisTimer = setTimeout(() => {
            this.showResultScreen();
          }, 700);
        }, 800);
      }, 800);
    }, 700);
  }

  setStepStatus(stepEl, status) {
    if (!stepEl) return;
    stepEl.setAttribute('data-status', status);
    stepEl.className = `progress-step-item ${status}`;
  }

  showResultScreen() {
    if (this.analysisTimer) {
      clearTimeout(this.analysisTimer);
      this.analysisTimer = null;
    }

    // Match sample if present
    let matchedSample = null;
    if (this.currentSampleId) {
      matchedSample = SAMPLES.find(s => s.id === this.currentSampleId);
    }
    if (!matchedSample && this.currentCropName) {
      const lower = this.currentCropName.toLowerCase();
      matchedSample = SAMPLES.find(s => lower.includes(s.crop.toLowerCase()));
    }

    const isSample = !!matchedSample;
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedTimestamp = `${day}-${month}-${year}, ${time}`;

    this.currentScanContext = {
      cropName: matchedSample ? `${matchedSample.crop} leaf` : (this.currentCropName || 'Crop leaf'),
      dataUrl: this.currentDataUrl || (matchedSample ? matchedSample.image : 'assets/samples/tomato_early_blight.jpg'),
      specs: this.currentSpecs || '0.8 MB · JPG',
      sampleData: matchedSample,
      isSample: isSample,
      timestamp: formattedTimestamp
    };

    this.renderScanResult(this.currentScanContext);
    state.setTab('scan-result');
  }

  renderScanResult(ctx) {
    // Reset save button state
    if (this.btnResultSaveHistory) {
      this.btnResultSaveHistory.classList.remove('saved');
    }
    if (this.btnSaveHistoryLabel) {
      this.btnSaveHistoryLabel.textContent = 'Save to History';
    }

    // Hide any previous error
    if (this.resultErrorCard) {
      this.resultErrorCard.style.display = 'none';
    }

    // Populate photo card
    if (this.resultCropImg) this.resultCropImg.src = ctx.dataUrl;
    if (this.resultPhotoCropName) this.resultPhotoCropName.textContent = ctx.cropName;
    if (this.resultPhotoTimestamp) this.resultPhotoTimestamp.textContent = ctx.timestamp;
    if (this.resultPhotoSpecs) this.resultPhotoSpecs.textContent = ctx.specs;
    if (this.resultPhotoStatus) {
      this.resultPhotoStatus.textContent = ctx.isSample ? 'Analysis Complete' : 'Analysis Ready';
    }

    // Analysis Mode Badge: strictly DEMO RESULT
    if (this.resultModeBadge) {
      this.resultModeBadge.className = 'result-mode-pill demo';
    }
    if (this.resultModeText) {
      this.resultModeText.textContent = 'DEMO RESULT';
    }

    if (ctx.isSample && ctx.sampleData) {
      const s = ctx.sampleData;

      // Demonstration Notice Box
      if (this.resultNoticeHeading) this.resultNoticeHeading.textContent = 'DEMO RESULT';
      if (this.resultNoticeMessage) {
        this.resultNoticeMessage.textContent = 'This is a demonstration result. Connect the crop analysis backend for real AI diagnosis.';
      }

      // Disease / Possible Issue
      if (this.resultDiseaseName) this.resultDiseaseName.textContent = s.disease;
      if (this.resultPathogenName) {
        this.resultPathogenName.textContent = s.pathogen ? `Pathogen: ${s.pathogen}` : '';
      }
      if (this.resultConfidenceVal) {
        this.resultConfidenceVal.textContent = `${s.confidence} (Demo Reference)`;
      }
      if (this.resultSeverityVal) {
        this.resultSeverityVal.className = `severity-pill ${s.severity}`;
        this.resultSeverityVal.textContent = s.severityLabel;
      }
      if (this.resultDiseaseDesc) {
        this.resultDiseaseDesc.textContent = s.description;
      }

      // Observed Symptoms
      if (this.resultSymptomsList) {
        this.resultSymptomsList.innerHTML = s.symptoms.map(sym => `
          <li class="symptom-item">
            <svg class="symptom-bullet-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>${sym}</span>
          </li>
        `).join('');
      }

      // Recommended Treatment
      if (this.resultOrganicList) {
        this.resultOrganicList.innerHTML = s.organicTreatment.map(t => `<li>${t}</li>`).join('');
      }
      if (this.resultChemicalList) {
        this.resultChemicalList.innerHTML = s.chemicalTreatment.map(t => `<li>${t}</li>`).join('');
      }

      // Prevention Tips
      if (this.resultPreventionList) {
        this.resultPreventionList.innerHTML = s.prevention.map(p => `<li>${p}</li>`).join('');
      }
    } else {
      // User Uploaded Photo (Strict compliance: Do NOT fabricate disease or AI scores)
      if (this.resultNoticeHeading) this.resultNoticeHeading.textContent = 'DEMO / BACKEND INTEGRATION REQUIRED';
      if (this.resultNoticeMessage) {
        this.resultNoticeMessage.textContent = 'Real AI analysis will appear here once the crop analysis backend is connected. This demonstration does not fabricate diagnostic data.';
      }

      if (this.resultDiseaseName) this.resultDiseaseName.textContent = 'Crop Analysis Ready';
      if (this.resultPathogenName) this.resultPathogenName.textContent = 'AI Model: Backend integration pending';
      if (this.resultConfidenceVal) this.resultConfidenceVal.textContent = 'Not Available';
      if (this.resultSeverityVal) {
        this.resultSeverityVal.className = 'severity-pill completed';
        this.resultSeverityVal.textContent = 'Image Ready';
      }
      if (this.resultDiseaseDesc) {
        this.resultDiseaseDesc.textContent = 'Your crop photo has been successfully uploaded and checked for image quality. Real-time pathogen identification and confidence metrics require connecting to a live crop-analysis model API.';
      }

      if (this.resultSymptomsList) {
        this.resultSymptomsList.innerHTML = `
          <li class="symptom-item">
            <svg class="symptom-bullet-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span>Crop foliage image validated for adequate lighting and focus.</span>
          </li>
          <li class="symptom-item">
            <svg class="symptom-bullet-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span>Automated symptom extraction requires backend ML service connection.</span>
          </li>
        `;
      }

      if (this.resultOrganicList) {
        this.resultOrganicList.innerHTML = `
          <li>Consult with your local Krishi Vigyan Kendra (KVK) or extension officer with your sample for physical inspection.</li>
          <li>Ensure proper soil drainage and adequate spacing to promote canopy airflow.</li>
        `;
      }
      if (this.resultChemicalList) {
        this.resultChemicalList.innerHTML = `
          <li>Chemical fungicides or pesticides should strictly follow recommendations from certified state agricultural authorities.</li>
        `;
      }

      if (this.resultPreventionList) {
        this.resultPreventionList.innerHTML = `
          <li>Routinely inspect crop foliage twice weekly for early lesion or pest emergence.</li>
          <li>Maintain certified disease-free planting stock and clean farm equipment between plots.</li>
        `;
      }
    }
  }

  saveCurrentScanToHistory() {
    if (!this.currentScanContext) return;
    const ctx = this.currentScanContext;

    const historyRecord = {
      id: 'scan-' + Date.now(),
      crop: ctx.sampleData ? ctx.sampleData.crop : ctx.cropName,
      cropScientific: ctx.sampleData ? ctx.sampleData.cropScientific : 'Plantae',
      disease: ctx.isSample && ctx.sampleData ? `${ctx.sampleData.disease} (Demo)` : 'Crop Check (Demo)',
      confidence: ctx.isSample && ctx.sampleData ? ctx.sampleData.confidence : 'Demo',
      severity: ctx.isSample && ctx.sampleData ? ctx.sampleData.severity : 'completed',
      severityLabel: ctx.isSample && ctx.sampleData ? ctx.sampleData.severityLabel : 'Analysis Ready',
      image: ctx.dataUrl || 'assets/samples/tomato_early_blight.jpg',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      description: ctx.sampleData ? ctx.sampleData.description : 'Demo crop inspection saved to archive.',
      symptoms: ctx.sampleData ? ctx.sampleData.symptoms : [],
      organicTreatment: ctx.sampleData ? ctx.sampleData.organicTreatment : [],
      chemicalTreatment: ctx.sampleData ? ctx.sampleData.chemicalTreatment : [],
      prevention: ctx.sampleData ? ctx.sampleData.prevention : []
    };

    state.addScanToHistory(historyRecord);

    if (this.btnResultSaveHistory) {
      this.btnResultSaveHistory.classList.add('saved');
    }
    if (this.btnSaveHistoryLabel) {
      this.btnSaveHistoryLabel.textContent = 'Saved to History ✓';
    }
  }

  showError(title, message) {
    if (!this.errorCard || !this.errorTitle || !this.errorDesc) return;
    this.errorTitle.textContent = title;
    this.errorDesc.textContent = message;
    this.errorCard.style.display = 'flex';
    this.errorCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  clearError() {
    if (this.errorCard) {
      this.errorCard.style.display = 'none';
    }
  }

  resetFileInputs() {
    if (this.cameraInput) this.cameraInput.value = '';
    if (this.galleryInput) this.galleryInput.value = '';
    this.currentFile = null;
  }

  resetScanFlow() {
    if (this.analysisTimer) {
      clearTimeout(this.analysisTimer);
      this.analysisTimer = null;
    }
    this.resetToUpload();
    this.clearError();
  }
}
