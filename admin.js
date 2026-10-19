(() => {
  const config = window.SITE_ANALYTICS;
  const byId = id => document.getElementById(id);
  const message = (text, error = false) => {
    byId('stats-message').textContent = text;
    byId('stats-message').dataset.error = String(error);
  };
  byId('login-form').addEventListener('submit', event => event.preventDefault());
  if (!window.firebase || !config?.firebase || !config.adminUid) {
    byId('login-button').disabled = true;
    message('Setup is not complete. Configure the administrator UID and private Firestore rules before using this dashboard.');
    return;
  }
  const app = firebase.apps.find(item => item.name === 'website-stats') ||
    firebase.initializeApp(config.firebase, 'website-stats');
  const auth = app.auth();
  const db = app.firestore();
  const pageSize = 200;
  let records = [];
  let cursor = null;
  let exhausted = false;
  let loading = false;
  let generation = 0;
  const formatDate = value => value instanceof Date && Number.isFinite(value.getTime()) ? value.toLocaleString() : 'Not recorded';
  const text = value => typeof value === 'string' ? value : '';
  const locationText = record => [...new Set([record.city, record.region, record.country].filter(Boolean))].join(', ') || 'Unknown';

  function addRow(body, cells) {
    const row = document.createElement('tr');
    cells.forEach(value => {
      const cell = document.createElement('td');
      cell.textContent = String(value);
      row.appendChild(cell);
    });
    body.appendChild(row);
  }
  function render() {
    const term = byId('visitor-filter').value.trim().toLowerCase();
    const visible = records.filter(record => `${record.ip} ${locationText(record)} ${record.page}`.toLowerCase().includes(term));
    byId('visit-count').textContent = String(records.length);
    byId('ip-count').textContent = String(new Set(records.map(record => record.ip).filter(Boolean)).size);
    byId('country-count').textContent = String(new Set(records.map(record => record.country).filter(country => country && country !== 'Unknown')).size);
    const groups = new Map();
    visible.forEach(record => {
      const current = groups.get(record.ip);
      if (!current) groups.set(record.ip, { ...record, count: 1, first: record.date, last: record.date });
      else {
        current.count++;
        if (record.date && (!current.first || record.date < current.first)) current.first = record.date;
        if (record.date && (!current.last || record.date > current.last)) current.last = record.date;
      }
    });
    const ipBody = byId('ip-table-body');
    ipBody.replaceChildren();
    [...groups.values()].sort((a, b) => b.count - a.count).forEach(group => addRow(ipBody, [
      group.ip || 'IP not recorded', locationText(group), group.count, formatDate(group.first), formatDate(group.last)
    ]));
    const visitBody = byId('visitor-table-body');
    visitBody.replaceChildren();
    visible.forEach(record => addRow(visitBody, [formatDate(record.date), record.ip || 'IP not recorded', locationText(record), record.page || 'Not recorded (legacy)']));
    if (!visible.length) {
      addRow(ipBody, ['No matching records', '', '', '', '']);
      addRow(visitBody, ['No matching records', '', '', '']);
    }
    byId('loaded-count').textContent = `${records.length} records loaded · ${visible.length} match the filter`;
    byId('load-more-button').disabled = exhausted || loading;
  }
  function reset() {
    generation++;
    records = [];
    cursor = null;
    exhausted = false;
    loading = false;
    byId('visitor-filter').value = '';
    byId('signed-in-as').textContent = '';
    render();
  }
  async function loadRecords(fresh = false) {
    if (loading || auth.currentUser?.uid !== config.adminUid) return;
    if (fresh) { records = []; cursor = null; exhausted = false; }
    if (exhausted) return;
    loading = true;
    const requestGeneration = generation;
    byId('refresh-button').disabled = true;
    byId('load-more-button').disabled = true;
    message('Loading visit records…');
    try {
      let query = db.collection('visitors').orderBy('timestamp', 'desc').limit(pageSize);
      if (cursor) query = query.startAfter(cursor);
      const snapshot = await query.get();
      if (requestGeneration !== generation || auth.currentUser?.uid !== config.adminUid) return;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        records.push({
          id: doc.id, ip: text(data.ip), country: text(data.country), region: text(data.region),
          city: text(data.city), page: text(data.page), date: data.timestamp?.toDate?.() || null
        });
      });
      cursor = snapshot.docs.at(-1) || cursor;
      exhausted = snapshot.size < pageSize;
      message(config.enabled ? 'Visitor tracking is enabled. Times use your browser’s local time zone.' : 'Visitor tracking is currently disabled. Existing records can still be viewed.');
    } catch (error) {
      if (requestGeneration !== generation) return;
      message(error.code === 'permission-denied' ? 'Access denied. Check that the deployed Firestore rules permit only your administrator UID.' : 'Could not load records. Check the connection and Firebase configuration, then refresh.', true);
    } finally {
      if (requestGeneration === generation) {
        loading = false;
        byId('refresh-button').disabled = false;
        render();
      }
    }
  }
  auth.onAuthStateChanged(user => {
    reset();
    const allowed = user?.uid === config.adminUid;
    byId('login-section').hidden = allowed;
    byId('stats-section').hidden = !allowed;
    if (allowed) {
      byId('signed-in-as').textContent = user.email || 'Administrator';
      loadRecords(true);
    } else if (user) {
      message('This account is not the website administrator.', true);
      auth.signOut().catch(() => {});
    }
  });
  byId('login-form').addEventListener('submit', async () => {
    byId('login-button').disabled = true;
    message('Signing in…');
    try {
      await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
      await auth.signInWithEmailAndPassword(byId('email').value.trim(), byId('password').value);
    } catch {
      message('Login failed. Check your administrator email, password and Firebase Authentication settings.', true);
    } finally {
      byId('password').value = '';
      byId('login-button').disabled = false;
    }
  });
  byId('logout-button').addEventListener('click', async () => {
    // Clear the IP table immediately, even if sign-out takes time.
    byId('stats-section').hidden = true;
    reset();
    try { await auth.signOut(); message('Signed out.'); }
    catch { message('Sign-out could not be confirmed. Close this tab to end the dashboard session.', true); }
  });
  byId('refresh-button').addEventListener('click', () => loadRecords(true));
  byId('load-more-button').addEventListener('click', () => loadRecords());
  byId('visitor-filter').addEventListener('input', render);
})();
