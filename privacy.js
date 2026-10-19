(() => {
  const button = document.getElementById('privacy-toggle');
  const status = document.getElementById('privacy-status');
  function update() {
    try {
      const disabled = localStorage.getItem('website-analytics-opt-out') === 'true';
      button.textContent = disabled ? 'Allow visit statistics' : 'Disable visit statistics';
      status.textContent = disabled ? 'Optional visit statistics are disabled in this browser.' : 'No browser opt-out is saved. Privacy signals are still respected.';
    } catch {
      status.textContent = 'Browser storage is unavailable. Use Global Privacy Control or Do Not Track to disable statistics.';
      button.disabled = true;
    }
  }
  button.addEventListener('click', () => {
    try {
      const disabled = localStorage.getItem('website-analytics-opt-out') === 'true';
      localStorage.setItem('website-analytics-opt-out', String(!disabled));
      sessionStorage.removeItem('website-ip-cache');
    } catch {}
    update();
  });
  update();
})();
