// Enable only after publishing the private Firestore rules and setting adminUid.
(() => {
  const config = window.SITE_ANALYTICS;
  const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  if (!config?.enabled || !config.adminUid || !window.firebase || isLocal ||
      !['http:', 'https:'].includes(location.protocol) ||
      navigator.globalPrivacyControl || navigator.doNotTrack === '1') return;
  try {
    if (localStorage.getItem('website-analytics-opt-out') === 'true') return;
  } catch { /* Analytics also works without browser storage. */ }

  const clean = (value, limit = 96) => typeof value === 'string' ? value.slice(0, limit) : '';
  const validIp = value => typeof value === 'string' && value.length <= 45 &&
    (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(value) || /^[\da-f]*:[\da-f:]+$/i.test(value));

  async function lookupVisitor() {
    try {
      const cached = JSON.parse(sessionStorage.getItem('website-ip-cache') || 'null');
      if (cached && Date.now() - cached.at < 30 * 60 * 1000 && validIp(cached.data.ip)) return cached.data;
    } catch { /* A fresh lookup works without session storage. */ }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    try {
      const response = await fetch('https://ipapi.co/json/', {
        signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer'
      });
      if (!response.ok) throw new Error('IP lookup unavailable');
      const data = await response.json();
      if (data.error || !validIp(data.ip)) throw new Error('No usable public IP');
      const visitor = {
        ip: data.ip,
        country: clean(data.country_name) || 'Unknown',
        region: clean(data.region),
        city: clean(data.city)
      };
      try { sessionStorage.setItem('website-ip-cache', JSON.stringify({ at: Date.now(), data: visitor })); } catch {}
      return visitor;
    } finally { clearTimeout(timeout); }
  }

  async function recordVisit() {
    let visitor;
    try { visitor = await lookupVisitor(); }
    catch { visitor = { ip: '', country: 'Unknown', region: '', city: '' }; }
    const app = firebase.apps.find(item => item.name === 'website-stats') ||
      firebase.initializeApp(config.firebase, 'website-stats');
    await app.firestore().collection('visitors').add({
      ...visitor,
      // Queries and fragments can contain private values; only keep the path.
      page: location.pathname.slice(0, 300),
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      schemaVersion: 2
    });
  }
  recordVisit().catch(() => { /* Analytics must never interrupt the website. */ });
})();
