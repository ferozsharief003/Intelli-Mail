// Relative path allows seamlessly hosting on local, LAN, or production servers
const API_BASE = '/api';
let selectedEmailContent = '';
let currentAbortController = null; // Prevents race conditions and state sticking

document.addEventListener('DOMContentLoaded', () => {
  fetchEmails();
  
  const generateBtn = document.getElementById('generate-btn');
  if (generateBtn) {
    generateBtn.addEventListener('click', generateReply);
  }
});

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
        // Prevent re-triggering if clicking the currently selected email
        if (card.classList.contains('selected')) return;

        document.querySelectorAll('.email-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedEmailContent = email.content;
        
        // Switch workspace from placeholder to active detail view smoothly
        const placeholder = document.getElementById('workspace-placeholder');
        const activeWorkspace = document.getElementById('active-workspace');
        if (placeholder) placeholder.classList.add('hidden');
        if (activeWorkspace) activeWorkspace.classList.remove('hidden');

        // Populate email detail view fields
        const detailSubject = document.getElementById('detail-subject');
        const detailSender = document.getElementById('detail-sender');
        const detailTime = document.getElementById('detail-time');
        const detailBody = document.getElementById('detail-body');

        if (detailSubject) detailSubject.innerText = email.subject || 'No Subject';
        if (detailSender) detailSender.innerText = `From: ${email.sender || 'Unknown'}`;
        if (detailTime) detailTime.innerText = email.timestamp || '';
        if (detailBody) detailBody.innerText = email.content || '';

        // Hide stale reply draft on email switch
        const outputDiv = document.getElementById('reply-output');
        if (outputDiv) outputDiv.classList.add('hidden');

        analyzeEmail(email.content);
      });

      container.appendChild(card);

      // Auto-select first email on initial load to populate workspace instantly
      if (index === 0) card.click();
    });
  } catch (err) {
    container.innerHTML = `<p style="color: #ef4444; padding: 16px;">Failed to connect to backend. Ensure app.py is running.</p>`;
    if (countBadge) countBadge.innerText = 'Error';
  }
}

// 2. Analyze selected email safely without glitches
async function analyzeEmail(content) {
  const analysisCard = document.getElementById('analysis-card');
  const analysisText = document.getElementById('analysis-text');
  if (!analysisCard || !analysisText) return;

  // Abort any ongoing pending fetch from previous fast-clicks
  if (currentAbortController) {
    currentAbortController.abort();
  }
  currentAbortController = new AbortController();

  // Subtle opacity state change prevents layout collapse/jump
  analysisCard.style.opacity = '0.5';
  analysisText.innerText = 'Analyzing message with Gemini AI...';

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
      analysisText.innerHTML = `<span style="color: #ef4444;">Error processing AI analysis.</span>`;
    }
  } finally {
    analysisCard.style.opacity = '1';
  }
}

function renderAnalysis(data) {
  const analysisCard = document.getElementById('analysis-card');
  if (!analysisCard) return;

  const points = Array.isArray(data.why_important) 
    ? data.why_important.map(p => `<li>${p}</li>`).join('')
    : `<li>${data.why_important || ''}</li>`;

  analysisCard.innerHTML = `
    <h4>Email Analysis & Urgency — <span style="color: var(--accent-color);">${data.priority || 'General'}</span></h4>
    <p style="margin: 8px 0;"><strong>Summary:</strong> ${data.summary || 'N/A'}</p>
    <p><strong>Deadline:</strong> ${data.deadline || 'N/A'}</p>
    <p style="margin-top: 4px;"><strong>Recommended Action:</strong> ${data.action_item || 'N/A'}</p>
    <ul style="margin-left: 20px; margin-top: 8px; color: var(--text-muted); font-size: 0.9rem;">${points}</ul>
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