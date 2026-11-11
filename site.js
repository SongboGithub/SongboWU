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

  document.querySelectorAll('[data-paper-gallery]').forEach(gallery => {
    const buttons = [...gallery.querySelectorAll('[data-result-for]')];
    const results = [...gallery.querySelectorAll('.paper-result')];
    buttons.forEach(button => button.addEventListener('click', () => {
      buttons.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
      results.forEach(result => { result.hidden = result.id !== button.dataset.resultFor; });
    }));
  });

})();
