(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.getElementById('site-nav');
  menuButton?.addEventListener('click', () => {
    if (!navigation) return;
    const open = navigation.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navigation?.classList.contains('open')) {
      navigation.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.focus();
    }
  });

  // Keep bookmarks from the former single-page site useful.
  if (document.body.dataset.page === 'home') {
    const pages = {
      research: 'research.html', projects: 'projects.html',
      publications: 'publications.html', people: 'supervision.html',
      teaching: 'teaching.html', experience: 'experience.html', contact: 'contact.html'
    };
    const followBookmark = () => {
      const destination = pages[location.hash.slice(1)];
      if (destination) location.replace(destination);
    };
    followBookmark();
    window.addEventListener('hashchange', followBookmark);
  }

  // Native scrolling remains untouched; only decorative linework moves.
  const fields = [...document.querySelectorAll('[data-field]')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let fieldFrame = 0;
  const drawFields = () => {
    fieldFrame = 0;
    const viewport = window.innerHeight;
    const distance = window.innerWidth < 690 ? 18 : 48;
    const positions = fields.map(field => {
      const rect = field.getBoundingClientRect();
      const progress = (viewport / 2 - rect.top - rect.height / 2) / ((viewport + rect.height) / 2);
      return Math.max(-1, Math.min(1, progress)) * distance;
    });
    fields.forEach((field, i) => field.style.setProperty('--field-y', `${positions[i].toFixed(2)}px`));
  };
  const scheduleFields = () => {
    if (!reducedMotion.matches && !fieldFrame && fields.length) fieldFrame = requestAnimationFrame(drawFields);
  };
  const syncMotionPreference = () => {
    window.removeEventListener('scroll', scheduleFields);
    window.removeEventListener('resize', scheduleFields);
    cancelAnimationFrame(fieldFrame);
    fieldFrame = 0;
    if (reducedMotion.matches) {
      fields.forEach(field => field.style.removeProperty('--field-y'));
    } else if (fields.length) {
      window.addEventListener('scroll', scheduleFields, { passive: true });
      window.addEventListener('resize', scheduleFields, { passive: true });
      scheduleFields();
    }
  };
  reducedMotion.addEventListener('change', syncMotionPreference);
  syncMotionPreference();
  window.addEventListener('load', scheduleFields, { once: true });
  document.querySelectorAll('details').forEach(details => details.addEventListener('toggle', scheduleFields));

  document.querySelectorAll('[data-paper-gallery]').forEach(gallery => {
    const buttons = [...gallery.querySelectorAll('[data-result-for]')];
    const results = [...gallery.querySelectorAll('.paper-result')];
    buttons.forEach(button => button.addEventListener('click', () => {
      buttons.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
      results.forEach(result => { result.hidden = result.id !== button.dataset.resultFor; });
    }));
  });

})();
