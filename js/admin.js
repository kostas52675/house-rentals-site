// ============================================================
// ADMIN PANEL — login (password -> httpOnly session cookie) και
// λίστα διαμερισμάτων με toggle Ενοικιασμένο <-> Διαθέσιμο.
// Το toggle σε "Διαθέσιμο" ενημερώνει backend-side όλη τη
// waitlist του διαμερίσματος (βλ. netlify/functions/admin-toggle-unit.js).
// ============================================================

const loginView = document.getElementById('adminLoginView');
const panelView = document.getElementById('adminPanelView');
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const panelMessage = document.getElementById('panelMessage');
const unitsContainer = document.getElementById('unitsContainer');
const logoutBtn = document.getElementById('logoutBtn');

function showLogin(message) {
  loginView.style.display = 'block';
  panelView.style.display = 'none';
  loginMessage.textContent = message || '';
  loginMessage.className = message ? 'admin-message admin-message--error' : 'admin-message';
}

function showPanel() {
  loginView.style.display = 'none';
  panelView.style.display = 'block';
}

function setPanelMessage(text, isError) {
  panelMessage.textContent = text || '';
  panelMessage.className = text ? `admin-message admin-message--${isError ? 'error' : 'success'}` : 'admin-message';
}

function renderUnits(units) {
  const groups = new Map();
  units.forEach((u) => {
    if (!groups.has(u.location_name)) groups.set(u.location_name, []);
    groups.get(u.location_name).push(u);
  });

  unitsContainer.innerHTML = Array.from(groups.entries()).map(([locationName, groupUnits]) => `
    <div class="admin-location-group">
      <h3>${locationName}</h3>
      ${groupUnits.map((u) => `
        <div class="admin-unit-row" data-unit-id="${u.id}">
          <div class="admin-unit-info">
            <span class="admin-unit-label">${u.label}</span>
            <span class="admin-status-pill ${u.rented ? 'admin-status-pill--rented' : 'admin-status-pill--available'}">
              ${u.rented ? 'Ενοικιασμένο' : 'Διαθέσιμο'}
            </span>
            <span class="admin-unit-meta">${u.waitlistCount} στη λίστα αναμονής</span>
          </div>
          <button type="button" class="admin-toggle-btn">
            ${u.rented ? 'Μαρκάρισμα ως Διαθέσιμο' : 'Μαρκάρισμα ως Ενοικιασμένο'}
          </button>
        </div>`).join('')}
    </div>`).join('');
}

async function loadUnits() {
  const res = await fetch('/api/admin-units');
  if (res.status === 401) {
    showLogin();
    return;
  }
  const data = await res.json();
  if (!res.ok) {
    setPanelMessage(data.error || 'Σφάλμα φόρτωσης.', true);
    return;
  }
  showPanel();
  renderUnits(data.units);
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginMessage.textContent = '';
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    const res = await fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: document.getElementById('adminPassword').value }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Λάθος κωδικός.');

    loginForm.reset();
    await loadUnits();
  } catch (err) {
    showLogin(err.message);
  } finally {
    submitBtn.disabled = false;
  }
});

logoutBtn.addEventListener('click', async () => {
  await fetch('/api/admin-logout', { method: 'POST' });
  showLogin();
});

unitsContainer.addEventListener('click', async (e) => {
  const btn = e.target.closest('.admin-toggle-btn');
  if (!btn) return;
  const row = btn.closest('.admin-unit-row');
  const unitId = row.dataset.unitId;

  btn.disabled = true;
  setPanelMessage('', false);

  try {
    const res = await fetch('/api/admin-toggle-unit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unitId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Κάτι πήγε στραβά.');

    if (!data.rented && data.notifiedCount > 0) {
      setPanelMessage(`Ενημερώθηκαν ${data.notifiedCount} εγγραφές στη λίστα αναμονής.`, false);
    }
    await loadUnits();
  } catch (err) {
    setPanelMessage(err.message, true);
    btn.disabled = false;
  }
});

loadUnits();
