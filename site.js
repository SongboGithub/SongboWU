(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.nav');
  menuButton?.addEventListener('click', () => {
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

  const carousel = document.querySelector('[data-carousel]');
  if (!carousel) return;
  const track = carousel.querySelector('.research-track');
  const slides = [...track.querySelectorAll('.research-slide')];
  const categories = [...carousel.querySelectorAll('[data-slide-to]')];
  const previous = carousel.querySelector('[data-carousel-prev]');
  const next = carousel.querySelector('[data-carousel-next]');
  const progress = carousel.querySelector('[role="status"]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = -1;
  let initialized = false;
  let scrollFrame;
  let width = track.clientWidth;

  function fitHeight() {
    if (active >= 0) track.style.height = `${slides[active].offsetHeight + 20}px`;
  }

  function update(index) {
    const changed = active !== index;
    active = index;
    slides.forEach((slide, i) => {
      slide.inert = i !== index;
      slide.setAttribute('aria-hidden', String(i !== index));
    });
    categories.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    previous.disabled = index === 0;
    next.disabled = index === slides.length - 1;
    if (changed) {
      progress.textContent = `${index + 1} / ${slides.length} · ${categories[index].textContent}`;
      if (initialized) history.replaceState(null, '', `#${slides[index].id}`);
    }
    fitHeight();
  }

  function goTo(index, smooth = true) {
    index = Math.max(0, Math.min(slides.length - 1, index));
    update(index);
    track.scrollTo({
      left: slides[index].offsetLeft,
      behavior: smooth && !reduceMotion.matches ? 'smooth' : 'instant'
    });
  }

  categories.forEach((button, index) => button.addEventListener('click', () => goTo(index)));
  previous.addEventListener('click', () => goTo(active - 1));
  next.addEventListener('click', () => goTo(active + 1));
  track.addEventListener('keydown', event => {
    if (event.target !== track) return;
    const destinations = { ArrowLeft: active - 1, ArrowRight: active + 1, Home: 0, End: slides.length - 1 };
    if (event.key in destinations) {
      event.preventDefault();
      goTo(destinations[event.key]);
    }
  });
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(() => {
      let nearest = 0;
      slides.forEach((slide, i) => {
        if (Math.abs(slide.offsetLeft - track.scrollLeft) < Math.abs(slides[nearest].offsetLeft - track.scrollLeft)) nearest = i;
      });
      update(nearest);
    });
  }, { passive: true });
  const observer = new ResizeObserver(() => {
    if (width !== track.clientWidth) {
      width = track.clientWidth;
      goTo(active, false);
    } else fitHeight();
  });
  observer.observe(track);
  slides.forEach(slide => observer.observe(slide));
  const requested = slides.findIndex(slide => `#${slide.id}` === location.hash);
  goTo(requested < 0 ? 0 : requested, false);
  initialized = true;
  window.addEventListener('hashchange', () => {
    const index = slides.findIndex(slide => `#${slide.id}` === location.hash);
    if (index >= 0) goTo(index);
  });
})();
