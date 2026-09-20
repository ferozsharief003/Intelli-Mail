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
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/emails`);
    const emails = await res.json();

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
        
        // Hide stale reply draft on email switch
        const outputDiv = document.getElementById('reply-output');
        if (outputDiv) outputDiv.classList.add('hidden');

        analyzeEmail(email.content);
      });

      container.appendChild(card);

      // Auto-select first email on initial load
      if (index === 0) card.click();
    });
  } catch (err) {
    container.innerHTML = `<p style="color: #ef4444; padding: 10px;">Failed to connect to backend. Ensure app.py is running.</p>`;
  }
}

// 2. Analyze selected email safely without glitches
async function analyzeEmail(content) {
  const card = document.getElementById('analysis-card');
  if (!card) return;

  // Abort any ongoing pending fetch from previous fast-clicks
  if (currentAbortController) {
    currentAbortController.abort();
  }
  currentAbortController = new AbortController();

  // Subtle opacity state change prevents layout collapse/jump
  card.style.opacity = '0.5';

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
      card.innerHTML = `<p style="color: #ef4444; padding: 10px;">Error processing analysis.</p>`;
    }
  } finally {
    card.style.opacity = '1';
  }
}

function renderAnalysis(data) {
  const card = document.getElementById('analysis-card');
  if (!card) return;

  const points = Array.isArray(data.why_important) 
    ? data.why_important.map(p => `<li>${p}</li>`).join('')
    : `<li>${data.why_important || ''}</li>`;

  card.innerHTML = `
    <h3>${data.priority || 'Email Analysis'}</h3>
    <p style="margin: 8px 0;"><strong>Summary:</strong> ${data.summary || 'N/A'}</p>
    <p><strong>Deadline:</strong> ${data.deadline || 'N/A'}</p>
    <p style="margin-top: 4px;"><strong>Action:</strong> ${data.action_item || 'N/A'}</p>
    <ul style="margin-left: 20px; margin-top: 8px;">${points}</ul>
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
    alert('Please enter or record a voice directive first!');
    if (voiceNoteInput) voiceNoteInput.focus();
    return;
  }

  if (generateBtn) {
    generateBtn.disabled = true;
    generateBtn.innerText = '⚡ Generating...';
  }
  
  if (outputDiv) outputDiv.classList.remove('hidden');
  if (draftText) draftText.innerText = 'Drafting email response...';

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
      generateBtn.innerText = 'Generate Reply';
    }
  }
}