const API_BASE = '/api';
let allEmails = [];
let selectedEmailContent = '';
let currentAbortController = null;

document.addEventListener('DOMContentLoaded', () => {
  // Initial email load
  fetchEmails();

  // Attach event listeners
  const generateBtn = document.getElementById('generate-btn');
  if (generateBtn) {
    generateBtn.addEventListener('click', generateReply);
  }

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }

  // Action toolbar listener bindings
  setupToolbarEvents();

  // Voice Assistant with Web Speech API & fallback simulation
  setupVoiceAssistant();
});

// Hide loader function
function hideLoader() {
  const loader = document.getElementById('app-loader');
  if (loader) {
    loader.classList.add('fade-out');
  }
}

// 1. Fetch emails list with dynamic sorting by priority
async function fetchEmails() {
  const container = document.getElementById('email-list');
  const countBadge = document.getElementById('email-count');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/emails`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    
    allEmails = await res.json();

    // Priority sorting order: critical (1) -> reply_today (2) -> fyi (3)
    const priorityWeight = {
      "critical": 1,
      "reply_today": 2,
      "fyi": 3
    };

    allEmails.sort((a, b) => {
      const weightA = priorityWeight[a.category] || 3;
      const weightB = priorityWeight[b.category] || 3;
      return weightA - weightB;
    });

    renderEmailList(allEmails);

  } catch (err) {
    console.error("Failed to fetch emails:", err);
    container.innerHTML = `<p style="color: #f28b82; padding: 16px; font-size: 0.85rem;">Failed to connect to backend service. Please check your app server.</p>`;
    if (countBadge) countBadge.innerText = 'Error';
  } finally {
    hideLoader();
  }
}

// Render filtered or full email list
function renderEmailList(emailsToRender) {
  const container = document.getElementById('email-list');
  const countBadge = document.getElementById('email-count');
  if (!container) return;

  if (countBadge) {
    countBadge.innerText = `${emailsToRender.length} messages`;
  }

  if (emailsToRender.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); padding: 16px; font-size: 0.85rem; text-align: center;">No emails found.</p>`;
    return;
  }

  container.innerHTML = '';
  emailsToRender.forEach((email, index) => {
    const card = document.createElement('div');
    card.className = 'email-card';
    card.dataset.id = email.id || index;
    const safeCategory = (email.category || 'fyi').replace('_', ' ');

    card.innerHTML = `
      <div class="email-header">
        <span class="sender">${escapeHtml(email.sender || 'Unknown')}</span>
        <span class="timestamp">${escapeHtml(email.timestamp || '')}</span>
      </div>
      <div class="subject">${escapeHtml(email.subject || 'No Subject')}</div>
      <span class="category-tag category-${email.category || 'fyi'}">${safeCategory}</span>
    `;

    card.addEventListener('click', () => {
      if (card.classList.contains('selected')) return;

      document.querySelectorAll('.email-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedEmailContent = email.content || '';

      const placeholder = document.getElementById('workspace-placeholder');
      const activeWorkspace = document.getElementById('active-workspace');
      if (placeholder) placeholder.classList.add('hidden');
      if (activeWorkspace) activeWorkspace.classList.remove('hidden');

      const detailSubject = document.getElementById('detail-subject');
      const detailSender = document.getElementById('detail-sender');
      const detailTime = document.getElementById('detail-time');
      const detailBody = document.getElementById('detail-body');

      if (detailSubject) detailSubject.innerText = email.subject || 'No Subject';
      if (detailSender) detailSender.innerText = `From: ${email.sender || 'Unknown'}`;
      if (detailTime) detailTime.innerText = email.timestamp || '';
      if (detailBody) detailBody.innerText = email.content || '';

      // Reset Draft Output
      const outputDiv = document.getElementById('reply-output');
      if (outputDiv) outputDiv.classList.add('hidden');

      // Trigger Gemini Analysis
      analyzeEmail(email.content);
    });

    container.appendChild(card);

    // Auto-select first email on load
    if (index === 0 && !document.querySelector('.email-card.selected')) {
      card.click();
    }
  });
}

// Real-time Search Handler
function handleSearch(e) {
  const query = e.target.value.toLowerCase().trim();
  if (!query) {
    renderEmailList(allEmails);
    return;
  }

  const filtered = allEmails.filter(email => {
    return (
      (email.sender && email.sender.toLowerCase().includes(query)) ||
      (email.subject && email.subject.toLowerCase().includes(query)) ||
      (email.content && email.content.toLowerCase().includes(query)) ||
      (email.category && email.category.toLowerCase().includes(query))
    );
  });

  renderEmailList(filtered);
}

// 2. Analyze selected email with Gemini backend
async function analyzeEmail(content) {
  const analysisCard = document.getElementById('analysis-card');
  if (!analysisCard) return;

  if (currentAbortController) {
    currentAbortController.abort();
  }
  currentAbortController = new AbortController();

  analysisCard.style.opacity = '0.5';
  analysisCard.innerHTML = `
    <div class="urgency-row">
      <span class="field-label">ANALYSIS:</span>
      <span class="priority-tag">PROCESSING</span>
    </div>
    <div id="analysis-text" class="analysis-content">
      <p style="color: var(--text-muted); font-size: 0.85rem;">Analyzing message urgency with Gemini AI...</p>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
      signal: currentAbortController.signal
    });

    if (!res.ok) throw new Error('Analysis API Error');

    const data = await res.json();
    renderAnalysis(data);
  } catch (err) {
    if (err.name !== 'AbortError') {
      analysisCard.innerHTML = `
        <div class="urgency-row">
          <span class="field-label">STATUS:</span>
          <span class="priority-tag" style="background: var(--critical-bg); color: var(--critical-text);">ERROR</span>
        </div>
        <p style="color: #f28b82; font-size: 0.85rem; margin-top: 8px;">Failed to generate AI intelligence response.</p>
      `;
    }
  } finally {
    analysisCard.style.opacity = '1';
  }
}

// Render structured analysis card
function renderAnalysis(data) {
  const analysisCard = document.getElementById('analysis-card');
  if (!analysisCard) return;

  const priorityClass = (data.priority || 'general').toLowerCase();
  const deadlineInfo = parseDeadlineTile(data.deadline);

  const points = Array.isArray(data.why_important)
    ? data.why_important.map(p => `<li>${escapeHtml(p)}</li>`).join('')
    : `<li>${escapeHtml(data.why_important || 'No additional insights available.')}</li>`;

  analysisCard.innerHTML = `
    <div class="urgency-row">
      <span class="field-label">PRIORITY:</span>
      <span id="ai-priority" class="priority-tag priority-${priorityClass}">${escapeHtml(data.priority || 'GENERAL')}</span>
    </div>

    <div id="analysis-text" class="analysis-content">
      <div class="summary-item"><strong>Summary:</strong> <span id="ai-summary">${escapeHtml(data.summary || 'N/A')}</span></div>
      <div class="summary-item"><strong>Recommended Action:</strong> <span id="ai-action">${escapeHtml(data.action_item || 'N/A')}</span></div>
    </div>

    <div class="deadline-widget">
      <div class="calendar-badge">
        <span class="cal-month">${deadlineInfo.month}</span>
        <span class="cal-day">${deadlineInfo.day !== '--' ? deadlineInfo.day : '⏰'}</span>
      </div>
      <div class="deadline-info">
        <span class="widget-label">ACTION DEADLINE</span>
        <div id="ai-deadline" class="deadline-text">${escapeHtml(deadlineInfo.label)}</div>
      </div>
    </div>

    <ul id="ai-reasons" class="reasons-list">${points}</ul>
  `;
}

// Parse deadline string into calendar widget data
function parseDeadlineTile(deadlineStr) {
  if (!deadlineStr || deadlineStr.toLowerCase().includes('no') || deadlineStr.toLowerCase().includes('none')) {
    return { month: 'TBD', day: '--', year: new Date().getFullYear().toString(), label: 'No deadline scheduled' };
  }

  const now = new Date();
  let targetDate = new Date();
  const lower = deadlineStr.toLowerCase();

  if (lower.includes('today')) {
    targetDate = now;
  } else if (lower.includes('tomorrow')) {
    targetDate.setDate(now.getDate() + 1);
  } else {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const foundDayIndex = days.findIndex(day => lower.includes(day));

    if (foundDayIndex !== -1) {
      const currentDayIndex = now.getDay();
      let diff = foundDayIndex - currentDayIndex;
      if (diff <= 0) diff += 7;
      targetDate.setDate(now.getDate() + diff);
    }
  }

  const targetMonth = targetDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const targetDay = String(targetDate.getDate());

  return { month: targetMonth, day: targetDay, label: deadlineStr };
}

// 3. Generate AI smart reply draft
async function generateReply() {
  const voiceNoteInput = document.getElementById('voice-input');
  const toneSelect = document.getElementById('tone-select');
  const outputDiv = document.getElementById('reply-output');
  const draftText = document.getElementById('draft-text');
  const generateBtn = document.getElementById('generate-btn');

  const voiceNote = voiceNoteInput ? voiceNoteInput.value.trim() : '';
  const tone = toneSelect ? toneSelect.value : 'Professional';

  if (!selectedEmailContent) {
    alert('Please select an email from your inbox first.');
    return;
  }

  if (!voiceNote) {
    alert('Please type or dictate your rough reply instruction first.');
    if (voiceNoteInput) voiceNoteInput.focus();
    return;
  }

  if (generateBtn) {
    generateBtn.disabled = true;
    generateBtn.innerText = '⚡ Generating...';
  }

  if (outputDiv) outputDiv.classList.remove('hidden');
  if (draftText) draftText.innerText = 'Drafting reply with Gemini AI...';

  try {
    const res = await fetch(`${API_BASE}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email_content: selectedEmailContent,
        voice_note: voiceNote,
        tone: tone
      })
    });

    if (!res.ok) throw new Error('Reply Generation Failed');

    const data = await res.json();
    if (draftText) draftText.innerText = data.draft || 'No draft generated.';
  } catch (err) {
    if (draftText) draftText.innerText = 'Error generating reply. Please verify API configuration.';
  } finally {
    if (generateBtn) {
      generateBtn.disabled = false;
      generateBtn.innerText = 'Generate Smart Reply';
    }
  }
}

// Setup Voice Assistant (Web Speech API + Simulation Fallback)
function setupVoiceAssistant() {
  const voiceDemoBtn = document.getElementById('voice-assistant-btn');
  const voiceInput = document.getElementById('voice-input');

  if (!voiceDemoBtn || !voiceInput) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      voiceDemoBtn.classList.add('listening');
      voiceDemoBtn.innerHTML = `<span>🔴 Listening...</span>`;
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      voiceInput.value = transcript;
    };

    recognition.onerror = () => {
      fallbackSimulation(voiceDemoBtn, voiceInput);
    };

    recognition.onend = () => {
      voiceDemoBtn.classList.remove('listening');
      voiceDemoBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="22"/>
        </svg>
        <span>Voice Assistant</span>`;
    };

    voiceDemoBtn.addEventListener('click', () => {
      try {
        recognition.start();
      } catch (e) {
        fallbackSimulation(voiceDemoBtn, voiceInput);
      }
    });
  } else {
    voiceDemoBtn.addEventListener('click', () => fallbackSimulation(voiceDemoBtn, voiceInput));
  }
}

function fallbackSimulation(btn, input) {
  btn.classList.add('listening');
  btn.innerHTML = `<span>🔴 Dictating...</span>`;
  input.value = '';

  setTimeout(() => {
    input.value = "Acknowledge the email, confirm the requested updates are being handled, and promise delivery on time.";
    btn.classList.remove('listening');
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="22"/>
      </svg>
      <span>Voice Assistant</span>`;
  }, 1200);
}

// Action Toolbar Event Handlers
function setupToolbarEvents() {
  const btnBack = document.getElementById('btn-back');
  const btnArchive = document.getElementById('btn-archive');
  const btnSpam = document.getElementById('btn-spam');
  const btnDelete = document.getElementById('btn-delete');

  const closeWorkspace = () => {
    const placeholder = document.getElementById('workspace-placeholder');
    const activeWorkspace = document.getElementById('active-workspace');
    if (placeholder) placeholder.classList.remove('hidden');
    if (activeWorkspace) activeWorkspace.classList.add('hidden');
    document.querySelectorAll('.email-card').forEach(c => c.classList.remove('selected'));
  };

  if (btnBack) btnBack.addEventListener('click', closeWorkspace);

  const removeSelectedEmail = () => {
    const selected = document.querySelector('.email-card.selected');
    if (selected) {
      selected.remove();
      closeWorkspace();
    }
  };

  if (btnArchive) btnArchive.addEventListener('click', removeSelectedEmail);
  if (btnSpam) btnSpam.addEventListener('click', removeSelectedEmail);
  if (btnDelete) btnDelete.addEventListener('click', removeSelectedEmail);
}

// Helper: XSS Protection
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}