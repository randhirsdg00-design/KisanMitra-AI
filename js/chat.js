/* =========================================================
   KisanMitra AI — AI Mitra Conversational Assistant Engine
   Manages #tab-ai-mitra dedicated screen and contextual queries
   Transparent DEMO MODE execution adhering to non-fabrication rules
   ========================================================= */

import { MITRA_KNOWLEDGE_BASE } from './data.js';
import { state } from './state.js';

export class AIChatMitra {
  constructor() {
    // Dedicated Screen Elements (#tab-ai-mitra)
    this.screen = document.getElementById('tab-ai-mitra');
    this.btnBackHome = document.getElementById('btn-mitra-back-home');
    this.screenMessagesContainer = document.getElementById('mitra-screen-messages');
    this.screenInput = document.getElementById('mitra-screen-input');
    this.screenForm = document.getElementById('mitra-screen-form');
    this.screenSendBtn = document.getElementById('btn-mitra-screen-send');
    this.screenMicBtn = document.getElementById('btn-mitra-screen-mic');
    this.screenChips = document.getElementById('mitra-suggestions-chips');
    this.screenTyping = document.getElementById('mitra-screen-typing');

    // Context Banner Elements
    this.contextBanner = document.getElementById('mitra-context-banner');
    this.contextText = document.getElementById('mitra-context-text');
    this.btnContextAsk = document.getElementById('btn-context-ask');
    this.btnContextDismiss = document.getElementById('btn-context-dismiss');
    this.activeContextQuery = null;

    // Drawer Elements (retained for backward compatibility)
    this.drawer = document.getElementById('chat-drawer');
    this.triggerBtn = document.getElementById('btn-floating-chat');
    this.closeBtn = document.getElementById('btn-close-chat');
    this.messagesContainer = document.getElementById('chat-messages');
    this.input = document.getElementById('chat-input-text');
    this.sendBtn = document.getElementById('btn-send-chat');
    this.micBtn = document.getElementById('btn-mic-chat');
    this.promptChips = document.getElementById('chat-prompt-chips');

    this.isListening = false;
    this.init();
  }

  init() {
    this.renderMessages();
    this.bindEvents();
    this.bindScreenEvents();

    state.subscribe((event) => {
      if (event === 'chatUpdated') {
        this.renderMessages();
      }
    });
  }

  bindScreenEvents() {
    // Back to Home
    if (this.btnBackHome) {
      this.btnBackHome.addEventListener('click', () => {
        state.setTab('home');
      });
    }

    // Screen Form submission
    if (this.screenForm) {
      this.screenForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.sendScreenMessage();
      });
    }

    // Screen Send Button
    if (this.screenSendBtn) {
      this.screenSendBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.sendScreenMessage();
      });
    }

    // Screen Input Enter key
    if (this.screenInput) {
      this.screenInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendScreenMessage();
        }
      });
    }

    // Screen Suggestion Chips
    if (this.screenChips) {
      this.screenChips.addEventListener('click', (e) => {
        const chip = e.target.closest('.mitra-chip');
        if (!chip) return;
        const prompt = chip.dataset.prompt || chip.textContent.trim();
        this.handleUserQuery(prompt);
      });
    }

    // Screen Voice Mic simulation
    if (this.screenMicBtn) {
      this.screenMicBtn.addEventListener('click', () => {
        this.toggleScreenMic();
      });
    }

    // Context Banner Actions
    if (this.btnContextAsk) {
      this.btnContextAsk.addEventListener('click', () => {
        if (this.activeContextQuery) {
          const q = this.activeContextQuery;
          this.dismissContextBanner();
          this.handleUserQuery(q);
        }
      });
    }

    if (this.btnContextDismiss) {
      this.btnContextDismiss.addEventListener('click', () => {
        this.dismissContextBanner();
      });
    }
  }

  bindEvents() {
    // Navigation to dedicated screen when clicking floating chat or home triggers
    if (this.triggerBtn) {
      this.triggerBtn.addEventListener('click', () => {
        state.setTab('ai-mitra');
        if (this.screenInput) this.screenInput.focus();
      });
    }

    const homeAskBtn = document.getElementById('btn-home-ask-mitra');
    if (homeAskBtn) {
      homeAskBtn.addEventListener('click', () => {
        state.setTab('ai-mitra');
        if (this.screenInput) this.screenInput.focus();
      });
    }

    const cardMitra = document.getElementById('card-action-mitra');
    if (cardMitra) {
      cardMitra.addEventListener('click', () => {
        state.setTab('ai-mitra');
        if (this.screenInput) this.screenInput.focus();
      });
    }

    // Drawer Close
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => {
        this.closeChat();
      });
    }

    // Drawer Send on click
    if (this.sendBtn) {
      this.sendBtn.addEventListener('click', () => {
        this.sendMessage();
      });
    }

    // Drawer Send on Enter
    if (this.input) {
      this.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    // Drawer Prompt Chips
    if (this.promptChips) {
      this.promptChips.addEventListener('click', (e) => {
        const chip = e.target.closest('.prompt-chip-btn');
        if (!chip) return;
        const prompt = chip.dataset.prompt || chip.textContent.trim();
        this.handleUserQuery(prompt);
      });
    }

    // Drawer Mic simulation
    if (this.micBtn) {
      this.micBtn.addEventListener('click', () => {
        this.toggleMic();
      });
    }
  }

  openChat() {
    // Navigate directly to dedicated screen per specifications
    state.setTab('ai-mitra');
    if (this.screenInput) {
      setTimeout(() => this.screenInput.focus(), 150);
    }
    this.scrollToBottom();
  }

  closeChat() {
    if (this.drawer) {
      this.drawer.classList.remove('open');
    }
  }

  openWithContext(displayTitle, userPrompt) {
    state.setTab('ai-mitra');
    if (this.contextBanner && this.contextText) {
      this.activeContextQuery = userPrompt || displayTitle;
      this.contextText.textContent = displayTitle;
      this.contextBanner.style.display = 'flex';
      this.contextBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    if (this.screenInput) {
      this.screenInput.placeholder = `Ask about ${displayTitle}...`;
      this.screenInput.focus();
    }
  }

  dismissContextBanner() {
    if (this.contextBanner) {
      this.contextBanner.style.display = 'none';
      this.activeContextQuery = null;
    }
    if (this.screenInput) {
      this.screenInput.placeholder = 'Ask AI Mitra anything about farming...';
    }
  }

  sendScreenMessage() {
    if (!this.screenInput) return;
    const text = this.screenInput.value.trim();
    if (!text) return; // Block empty messages per requirements
    this.screenInput.value = '';
    this.handleUserQuery(text);
  }

  sendMessage() {
    if (!this.input) return;
    const text = this.input.value.trim();
    if (!text) return; // Block empty messages
    this.input.value = '';
    this.handleUserQuery(text);
  }

  handleUserQuery(queryText) {
    if (!queryText || !queryText.trim()) return;

    // Add user message to persistent state
    state.addChatMessage('user', queryText.trim());
    this.showTypingIndicator();

    // Responsive simulation delay
    setTimeout(() => {
      this.removeTypingIndicator();
      const botResponse = this.generateResponse(queryText.trim());
      state.addChatMessage('bot', botResponse);
      this.scrollToBottom();
    }, 600);
  }

  generateResponse(query) {
    const qLower = query.toLowerCase();

    // Check knowledge base keyword matches
    for (const entry of MITRA_KNOWLEDGE_BASE) {
      const isMatch = entry.keywords.some(k => qLower.includes(k.toLowerCase()));
      if (isMatch) {
        return entry.response;
      }
    }

    // Hindi & Agronomic specific queries matching
    if (qLower.includes('पीले') || qLower.includes('yellow') || qLower.includes('पत्ती')) {
      return `🍃 **Foliar Yellowing Diagnostic Guide (Demo Response):**
• **Nitrogen Deficiency:** Pale yellowing begins on older lower leaves progressing upward. Solution: Top-dress Urea @ 40 kg/acre with irrigation.
• **Waterlogging / Drainage:** Roots deprived of oxygen cause generalized chlorosis. Ensure field drains are clear.
• **Iron/Zinc Chlorosis:** Yellowing of young leaves while veins remain green. Solution: Foliar spray of 0.5% Zinc Sulphate + 0.25% Lime.
• *Note: Connect an AI backend for personalized real-time model inferences.*`;
    }

    if (qLower.includes('पानी') || qLower.includes('water') || qLower.includes('irrigation') || qLower.includes('सिंचाई') || qLower.includes('धान')) {
      return `💧 **Irrigation Advisory (Demo Response):**
• **Wheat:** Requires 5-6 critical irrigations: (1) Crown Root Initiation at 21 days, (2) Tillering at 40-45 days, (3) Late Jointing at 60-65 days, (4) Flowering at 80-85 days, (5) Milking stage at 100 days.
• **Paddy (Rice):** Maintain 2-3 cm standing water during transplanting and tillering; adopt alternate wetting and drying (AWD) to conserve 30% water.
• *Note: Connect an AI backend for live sensor and telemetry data.*`;
    }

    if (qLower.includes('मंडी') || qLower.includes('mandi') || qLower.includes('price') || qLower.includes('भाव') || qLower.includes('rate')) {
      return `📈 **Mandi & Market Intelligence (Demo Response):**
• Real-time Agmarknet commodity arrivals and modal prices are available directly in our **[Mandi Rates]** tab.
• **Wheat Modal Rate:** Currently trading between ₹2,275 – ₹2,350/Quintal in Punjab/Haryana mandis.
• *Check the Mandi screen for state, district, and market-specific rate updates.*`;
    }

    if (qLower.includes('योजना') || qLower.includes('scheme') || qLower.includes('subsidy') || qLower.includes('pm-kisan') || qLower.includes('kisan')) {
      return `🏛️ **Agricultural Government Schemes (Demo Response):**
• **PM-KISAN:** ₹6,000 yearly in three ₹2,000 direct bank transfers. Ensure Aadhaar linking and e-KYC.
• **PMFBY Crop Insurance:** Non-preventable crop loss insurance at nominal 1.5% to 2% farmer premium.
• **Sub-Mission on Agricultural Mechanization:** Up to 40-50% subsidy on custom hiring tools and tractors.
• *Visit the Schemes tab to view complete application criteria and direct links.*`;
    }

    // Default transparent demo response
    return `🌾 **AI Mitra Agronomic Advisory (Demo Response):**
Thank you for your question regarding **"${query}"**.
• **Agronomic Field Tip:** Inspect field margins regularly and check soil moisture at 10cm depth before chemical application.
• **Pathology Assistance:** If you observe symptoms on leaves, use the **[📷 Scan Crop]** feature for immediate foliar analysis.
• **National Advisory Hotline:** For district-specific expert consultations, call the Kisan Call Centre toll-free at **1800-180-1551**.
• *Notice: This is a demonstration response. Connect an AI backend for live, conversational answers.*`;
  }

  toggleScreenMic() {
    this.isListening = !this.isListening;
    if (this.screenMicBtn) {
      if (this.isListening) {
        this.screenMicBtn.classList.add('listening');
        this.screenInput.placeholder = 'Listening... (Speak your farming question)';
        setTimeout(() => {
          this.screenInput.value = 'What fertilizer should I use for wheat?';
          this.isListening = false;
          this.screenMicBtn.classList.remove('listening');
          this.screenInput.placeholder = 'Ask AI Mitra anything about farming...';
          this.sendScreenMessage();
        }, 2000);
      } else {
        this.screenMicBtn.classList.remove('listening');
        this.screenInput.placeholder = 'Ask AI Mitra anything about farming...';
      }
    }
  }

  toggleMic() {
    this.isListening = !this.isListening;
    if (this.micBtn) {
      if (this.isListening) {
        this.micBtn.classList.add('listening');
        this.input.placeholder = 'Listening... (Speak your question)';
        setTimeout(() => {
          this.input.value = 'Why are my crop leaves turning yellow?';
          this.isListening = false;
          this.micBtn.classList.remove('listening');
          this.input.placeholder = 'Ask a question about farming...';
          this.sendMessage();
        }, 2000);
      } else {
        this.micBtn.classList.remove('listening');
        this.input.placeholder = 'Ask a question about farming...';
      }
    }
  }

  renderMessages() {
    const messages = state.chatMessages || [];

    // Render into dedicated screen container
    if (this.screenMessagesContainer) {
      this.screenMessagesContainer.innerHTML = messages.map(msg => {
        const formattedText = this.formatMarkdown(msg.text);
        const isBot = msg.sender === 'bot';
        const tagHtml = isBot ? `<span class="msg-tag">Demo Response</span>` : '';
        return `
          <div class="msg-row ${msg.sender}">
            <div class="msg-bubble">
              ${tagHtml}
              <div>${formattedText}</div>
              <div class="msg-time">${msg.time}</div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Render into drawer container
    if (this.messagesContainer) {
      this.messagesContainer.innerHTML = messages.map(msg => {
        const formattedText = this.formatMarkdown(msg.text);
        return `
          <div class="msg-row ${msg.sender}">
            <div class="msg-bubble">
              ${formattedText}
              <div class="msg-time">${msg.time}</div>
            </div>
          </div>
        `;
      }).join('');
    }

    this.scrollToBottom();
  }

  formatMarkdown(text) {
    let html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/•\s*(.*?)(\n|$)/g, '<li>$1</li>');
    
    if (html.includes('<li>')) {
      html = html.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
    }
    html = html.replace(/\n/g, '<br>');
    return html;
  }

  showTypingIndicator() {
    if (this.screenTyping) {
      this.screenTyping.style.display = 'block';
    }

    if (this.messagesContainer) {
      const typingEl = document.createElement('div');
      typingEl.id = 'typing-indicator';
      typingEl.className = 'msg-row bot';
      typingEl.innerHTML = `
        <div class="typing-bubble">
          <span style="font-size: 12px; color: var(--color-text-secondary); margin-right: 6px;">AI Mitra is thinking...</span>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      `;
      this.messagesContainer.appendChild(typingEl);
    }

    this.scrollToBottom();
  }

  removeTypingIndicator() {
    if (this.screenTyping) {
      this.screenTyping.style.display = 'none';
    }

    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
  }

  scrollToBottom() {
    if (this.screenMessagesContainer) {
      this.screenMessagesContainer.scrollTop = this.screenMessagesContainer.scrollHeight;
    }
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }
}
