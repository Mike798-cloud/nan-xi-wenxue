(() => {
  const root = document.documentElement;
  const site = root.dataset.site || 'unknown';
  const label = root.dataset.siteLabel || document.title;
  const key = 'nanxi:lastScroll:' + location.pathname + location.search;
  const visitKey = 'nanxi:visits';
  try {
    const visits = JSON.parse(localStorage.getItem(visitKey) || '[]');
    const now = Date.now();
    const next = visits.filter(v => v.path !== location.pathname + location.search);
    next.push({site, label, path: location.pathname + location.search, t: now});
    localStorage.setItem(visitKey, JSON.stringify(next.slice(-30)));
    const saved = Number(sessionStorage.getItem(key) || '0');
    if (saved > 0) requestAnimationFrame(() => scrollTo({top: saved, behavior: 'auto'}));
    addEventListener('pagehide', () => sessionStorage.setItem(key, String(scrollY)), {once:true});
  } catch (_) {}

  document.querySelectorAll('a[target="_blank"]').forEach(a => {
    a.rel = 'noopener noreferrer';
  });

  document.querySelectorAll('[data-print-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
})();
