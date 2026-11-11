(() => {
  const form = document.querySelector('[data-paper-filters]');
  const query = document.getElementById('paper-query');
  const year = document.getElementById('paper-year');
  const status = form.querySelector('[role="status"]');
  const normalize = text => text.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  const groups = [...document.querySelectorAll('[data-paper-group]')].map(section => ({
    section,
    entries: [...section.querySelectorAll('li')].map(entry => ({
      entry,
      text: normalize(entry.textContent),
      year: entry.textContent.match(/\(((?:19|20)\d{2})\)/)?.[1],
    })),
  }));
  const years = new Set(groups.flatMap(group => group.entries.map(entry => entry.year)).filter(Boolean));
  [...years].sort().reverse().forEach(value => year.add(new Option(value, value)));
  const params = new URLSearchParams(location.search);
  query.value = params.get('q') || '';
  if (years.has(params.get('year'))) year.value = params.get('year');

  let filtering = false;
  const expandedBeforeFilter = new Map();
  function render() {
    const words = normalize(query.value).trim().split(/\s+/).filter(Boolean);
    const active = Boolean(words.length || year.value);
    let total = 0;
    for (const {section, entries} of groups) {
      const expandable = section instanceof HTMLDetailsElement;
      if (expandable && active && !filtering) expandedBeforeFilter.set(section, section.open);
      let matching = 0;
      for (const {entry, text, year: entryYear} of entries) {
        const visible = (!year.value || year.value === entryYear) && words.every(word => text.includes(word));
        entry.hidden = !visible;
        if (visible) matching++;
      }
      section.hidden = matching === 0;
      if (expandable && active) section.open = matching > 0;
      if (expandable && !active && filtering) section.open = expandedBeforeFilter.get(section);
      total += matching;
    }
    if (!active) expandedBeforeFilter.clear();
    filtering = active;
    status.textContent = total ? `${total} ${total === 1 ? 'paper' : 'papers'}${active ? ' found' : ''}` : 'No papers match these filters.';
  }

  form.addEventListener('input', render);
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('reset', () => {
    requestAnimationFrame(render);
  });
  render();
  form.hidden = false;
})();
