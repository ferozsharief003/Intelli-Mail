const API_BASE = '/api';
let selectedEmailContent = '';
let currentAbortController = null;

document.addEventListener('DOMContentLoaded', () => {
  fetchEmails();
  
  const generateBtn = document.getElementById('generate-btn');
  if (generateBtn) {
    generateBtn.addEventListener('click', generateReply);
  }

  // Voice Assistant demonstration button hook
  const voiceDemoBtn = document.getElementById('voice-assistant-btn');
  const voiceInput = document.getElementById('voice-input');
  if (voiceDemoBtn && voiceInput) {
    voiceDemoBtn.addEventListener('click', () => {
      voiceDemoBtn.classList.add('listening');
      voiceDemoBtn.innerText = '🔴 Listening...';
      voiceInput.value = '';
      
      setTimeout(() => {
        voiceInput.value = "Acknowledge the request, state that finance clearance is underway, and commit to delivering the final breakdown on schedule.";
        voiceDemoBtn.classList.remove('listening');
        voiceDemoBtn.innerText = '🎙️ Voice Assistant';
      }, 1500);
    });
  }
});

// Hide loader function
function hideLoader() {
  const loader = document.getElementById('app-loader');
  if (loader) {
    loader.classList.add('fade-out');
  }
}

// 1. Fetch emails list
async function fetchEmails() {
  const container = document.getElementById('email-list');
  const countBadge = document.getElementById('email-count');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/emails`);
    const emails = await res.json();

    if (countBadge) {
      countBadge.innerText = `${emails.length} messages`;
    }

    container.innerHTML = '';
    emails.forEach((email, index) => {
      const card = document.createElement('div');
      card.className = 'email-card';
      const safeCategory = (email.category || '').replace('_', ' ');
      
      card.innerHTML = `
        <div class="email-header">
          <span class="sender">${email.sender}</span>
          <span class="timestamp">${email.timestamp}</span>
        </div>
        <div class="subject">${email.subject}</div>
        <span class="category-tag category-${email.category || 'fyi'}">${safeCategory}</span>
      `;

      card.addEventListener('click', () => {
        if (card.classList.contains('selected')) return;

        document.querySelectorAll('.email-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedEmailContent = email.content;
        
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

        const outputDiv = document.getElementById('reply-output');
        if (outputDiv) outputDiv.classList.add('hidden');

        analyzeEmail(email.content);
      });

      container.appendChild(card);

      if (index === 0) card.click();
    });
  } catch (err) {
    container.innerHTML = `<p style="color: #ef4444; padding: 16px;">Failed to connect to backend. Ensure app.py is running.</p>`;
    if (countBadge) countBadge.innerText = 'Error';
  } finally {
    hideLoader();
  }
}

// 2. Analyze selected email safely with proper element preservation
async function analyzeEmail(content) {
  const analysisCard = document.getElementById('analysis-card');
  if (!analysisCard) return;

  if (currentAbortController) {
    currentAbortController.abort();
  }
  currentAbortController = new AbortController();

  // Reset card structure to ensure loading text elements exist on every click
  analysisCard.style.opacity = '0.5';
  analysisCard.innerHTML = `
    <h4>Email Analysis & Urgency</h4>
    <p id="analysis-text" class="analysis-content">Analyzing message with Gemini AI...</p>
  `;

  try {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
      signal: currentAbortController.signal
    });
    
    const data = await res.json();
    renderAnalysis(data);
  } catch (err) {
    if (err.name !== 'AbortError') {
      const analysisText = document.getElementById('analysis-text');
      if (analysisText) {
        analysisText.innerHTML = `<span style="color: #ef4444;">Error processing AI analysis.</span>`;
      }
    }
  } finally {
    analysisCard.style.opacity = '1';
  }
}

// Render analysis including Calendar Deadline Widget
function renderAnalysis(data) {
  const analysisCard = document.getElementById('analysis-card');
  if (!analysisCard) return;

  const points = Array.isArray(data.why_important) 
    ? data.why_important.map(p => `<li>${p}</li>`).join('')
    : `<li>${data.why_important || ''}</li>`;

  analysisCard.innerHTML = `
    <h4>Email Analysis & Urgency — <span style="color: var(--accent-color);">${data.priority || 'General'}</span></h4>
    <p style="margin: 8px 0;"><strong>Summary:</strong> ${data.summary || 'N/A'}</p>
    <p style="margin-top: 4px;"><strong>Recommended Action:</strong> ${data.action_item || 'N/A'}</p>
    
    <div class="calendar-deadline-box">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
      <div>
        <strong>Calendar Sync (Deadline):</strong> <span style="color: var(--text-main);">${data.deadline || 'No immediate deadline'}</span>
      </div>
    </div>

    <ul style="margin-left: 20px; margin-top: 10px; color: var(--text-muted); font-size: 0.9rem;">${points}</ul>
  `;
}

// 3. Generate AI response draft
async function generateReply() {
  const voiceNoteInput = document.getElementById('voice-input');
  const toneSelect = document.getElementById('tone-select');
  const outputDiv = document.getElementById('reply-output');
  const draftText = document.getElementById('draft-text');
  const generateBtn = document.getElementById('generate-btn');

  const voiceNote = voiceNoteInput ? voiceNoteInput.value.trim() : '';
  const tone = toneSelect ? toneSelect.value : 'Professional';

  if (!selectedEmailContent) {
    alert('Please select an email first!');
    return;
  }

  if (!voiceNote) {
    alert('Please enter or dictate your rough reply instruction first!');
    if (voiceNoteInput) voiceNoteInput.focus();
    return;
  }

  if (generateBtn) {
    generateBtn.disabled = true;
    generateBtn.innerText = '⚡ Generating...';
  }
  
  if (outputDiv) outputDiv.classList.remove('hidden');
  if (draftText) draftText.innerText = 'Drafting email response with Gemini...';

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
    const data = await res.json();
    if (draftText) draftText.innerText = data.draft;
  } catch (err) {
    if (draftText) draftText.innerText = 'Error generating reply. Please check backend logs.';
  } finally {
    if (generateBtn) {
      generateBtn.disabled = false;
      generateBtn.innerText = 'Generate Smart Reply';
    }
  }
}