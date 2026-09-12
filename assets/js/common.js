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

/* Quiet investigation progress.
 * This is intentionally separate from each faux website: a 3px line and a tiny
 * optional label only. It records the furthest confirmed story milestone, never
 * points to the next clue, and never moves backwards when the player revisits pages.
 */
(() => {
  const PROGRESS_KEY = 'nanxi:investigation-progress:v1';
  const VISIT_KEY = 'nanxi:visits';
  const stages = [
    [8, '已进入南溪旧站，开始查阅公开记录'],
    [18, '已读到《河水向南》公开连载末尾'],
    [28, '已找到《河水向南》的未公开终稿'],
    [38, '已找到六月十一在2008年4月13日留下的旧帖'],
    [48, '已恢复槐序当晚删除的论坛主题'],
    [58, '已确认顾槐与4月14日客运事故存在关联'],
    [68, '已进入教师交流站，补上当年的校内背景'],
    [76, '已进入小满书店，调查进入后半段'],
    [84, '已进入南溪作家论坛，找到槐序离校前的写作与求职痕迹'],
    [92, '已找到出版社、博客与打印记录之间的对应关系'],
    [100, '主要调查记录已经串联完成']
  ];
  const safeNumber = (key) => {
    try { return Number(localStorage.getItem(key) || '0') || 0; } catch (_) { return 0; }
  };
  const saveNumber = (key, value) => {
    try { localStorage.setItem(key, String(value)); } catch (_) {}
  };
  const parseLocation = (value) => {
    const raw = String(value || '');
    const qIndex = raw.indexOf('?');
    return {
      path: (qIndex >= 0 ? raw.slice(0, qIndex) : raw).toLowerCase(),
      params: new URLSearchParams(qIndex >= 0 ? raw.slice(qIndex + 1) : '')
    };
  };
  const stageFor = (value) => {
    const {path, params} = parseLocation(value);
    if (!path) return 0;
    if (path.endsWith('/forum/recovered.html')) return 48;
    if (path.endsWith('/forum/june-20080413.html')) return 38;
    if (path.endsWith('/novel/index.html') || path.endsWith('/novel/')) return 28;
    if (path.endsWith('/reader/index.html') || path.endsWith('/reader/')) return 22;
    if (path.endsWith('/forum/river.html')) {
      const chapter = Number(params.get('chapter') || 1);
      return chapter >= 13 ? 18 : 10;
    }
    if (path.endsWith('/school/index.html') || path.endsWith('/school/')) return 16;
    if (path.endsWith('/news/index.html') || path.endsWith('/news/')) {
      const article = (params.get('article') || '').toLowerCase();
      if (article === 'accident' || article === 'accident2' || article === 'teacher') return 58;
      return 52;
    }
    if (path.endsWith('/teachers/index.html') || path.endsWith('/teachers/')) return 68;
    if (path.endsWith('/bookshop/index.html') || path.endsWith('/bookshop/')) return 76;
    if (path.endsWith('/writers/index.html') || path.endsWith('/writers/')) return 84;
    if (path.endsWith('/publisher/index.html') || path.endsWith('/publisher/') ||
        path.endsWith('/blog/index.html') || path.endsWith('/blog/') ||
        path.endsWith('/printshop/index.html') || path.endsWith('/printshop/')) return 92;
    if (path.endsWith('/index.html') || path.endsWith('/nan-xi-wenxue/') || path === '/') return 8;
    return 8;
  };
  const current = location.pathname + location.search;
  let saved = safeNumber(PROGRESS_KEY);
  let inferred = stageFor(current);
  try {
    const visits = JSON.parse(localStorage.getItem(VISIT_KEY) || '[]');
    inferred = Math.max(inferred, ...visits.map(v => stageFor(v.path)));
  } catch (_) {}

  const currentPath = location.pathname.toLowerCase();
  const onFinalManuscript = currentPath.endsWith('/novel/index.html') || currentPath.endsWith('/novel/');
  // The manuscript can be found earlier. It only becomes the closing milestone after
  // the player has already connected the late-stage publisher/blog/print-shop trail.
  if (onFinalManuscript && Math.max(saved, inferred) >= 92) inferred = 100;

  const progress = Math.max(saved, inferred);
  if (progress > saved) saveNumber(PROGRESS_KEY, progress);

  const stage = [...stages].reverse().find(([pct]) => progress >= pct) || stages[0];
  const pct = Math.max(0, Math.min(100, progress || 8));

  const style = document.createElement('style');
  style.id = 'nanxi-investigation-style';
  style.textContent = `
    #nanxi-progress-track{position:fixed;left:0;right:0;bottom:0;height:3px;background:rgba(45,43,38,.16);z-index:8700;pointer-events:none}
    #nanxi-progress-fill{height:100%;background:rgba(78,91,77,.78);width:0}
    #nanxi-progress-toggle{position:fixed;left:8px;bottom:9px;z-index:8750;border:1px solid rgba(74,70,62,.35);border-radius:0;background:rgba(247,244,234,.93);color:#5b574f;padding:3px 7px;font:11px/1.35 "Microsoft YaHei","PingFang SC",sans-serif;letter-spacing:.02em;cursor:pointer;opacity:.66}
    #nanxi-progress-toggle:hover,#nanxi-progress-toggle:focus-visible{opacity:1;outline:1px solid rgba(74,70,62,.5);outline-offset:1px}
    #nanxi-progress-panel{position:fixed;left:8px;bottom:39px;z-index:8751;width:min(306px,calc(100vw - 16px));border:1px solid rgba(74,70,62,.42);border-radius:0;background:#f6f2e8;color:#38352f;padding:10px 12px;font:12px/1.6 "Microsoft YaHei","PingFang SC",sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.08)}
    #nanxi-progress-panel[hidden]{display:none}
    #nanxi-progress-panel .np-title{display:flex;align-items:baseline;justify-content:space-between;gap:12px;border-bottom:1px solid rgba(74,70,62,.2);padding-bottom:5px;margin-bottom:6px}
    #nanxi-progress-panel .np-title b{font-size:16px;font-weight:600;color:#424d40}
    #nanxi-progress-panel p{margin:0;color:#5f5a51}
    @media(max-width:560px){#nanxi-progress-toggle{left:6px;bottom:8px;font-size:10px}#nanxi-progress-panel{left:6px;bottom:36px;width:calc(100vw - 12px)}}
    @media print{#nanxi-progress-track,#nanxi-progress-toggle,#nanxi-progress-panel{display:none!important}}
  `;
  document.head.appendChild(style);

  const track = document.createElement('div');
  track.id = 'nanxi-progress-track';
  track.setAttribute('aria-hidden', 'true');
  track.innerHTML = `<div id="nanxi-progress-fill" style="width:${pct}%"></div>`;

  const toggle = document.createElement('button');
  toggle.id = 'nanxi-progress-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'nanxi-progress-panel');
  toggle.textContent = `调查进度 · ${pct}%`;

  const panel = document.createElement('div');
  panel.id = 'nanxi-progress-panel';
  panel.hidden = true;
  panel.innerHTML = `<div class="np-title"><span>调查进度</span><b>${pct}%</b></div><p>${stage[1]}</p>`;

  const setOpen = (open) => {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  toggle.addEventListener('click', () => setOpen(panel.hidden));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) setOpen(false); });
  document.addEventListener('click', (e) => {
    if (!panel.hidden && e.target !== toggle && !panel.contains(e.target)) setOpen(false);
  });

  document.body.append(track, toggle, panel);
})();

/* Nanxi voluntary support layer.
 * Interaction model follows the 1-yuan support flow used in Songtao Grainstation,
 * with Nanxi-specific wording and a one-time auto trigger on the first visit to
 * Xiaoman Bookshop. Closing it never blocks progress and never auto-opens again.
 */
(() => {
  const STORAGE_KEY = '_nanxi_wenxue_support';
  const SESSION_KEY = '_nanxi_wenxue_support_session';
  const COOKIE_KEY = '_nanxi_support_flag';
  const AUTO_KEY = '_nanxi_support_auto_shown';
  const QR_CODE = 'https://github.com/Mike798-cloud/songtao-grainstation/raw/refs/heads/main/paycode.png';
  const safeGet = (store, key) => {
    try { return store.getItem(key) || ''; } catch (_) { return ''; }
  };
  const safeSet = (store, key, value) => {
    try { store.setItem(key, value); } catch (_) {}
  };
  const getCookie = (name) => {
    try {
      const needle = name + '=';
      for (const raw of document.cookie.split(';')) {
        const item = raw.trim();
        if (item.startsWith(needle)) return item.slice(needle.length);
      }
    } catch (_) {}
    return '';
  };
  const setCookie = (name, value, days) => {
    try {
      const d = new Date();
      d.setTime(d.getTime() + days * 86400000);
      document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/;SameSite=Lax`;
    } catch (_) {}
  };
  const Paywall = {
    hasPaid() {
      return !!(
        safeGet(localStorage, STORAGE_KEY) ||
        safeGet(sessionStorage, SESSION_KEY) ||
        getCookie(COOKIE_KEY)
      );
    },
    markPaid() {
      const token = this._generateToken();
      safeSet(localStorage, STORAGE_KEY, token);
      safeSet(sessionStorage, SESSION_KEY, token);
      setCookie(COOKIE_KEY, token, 365);
    },
    _generateToken() {
      const raw = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}_nanxi_studio`;
      try { return btoa(raw); } catch (_) { return raw; }
    },
    show() {
      if (this.hasPaid()) return;
      let overlay = document.getElementById('paywall-overlay');
      if (!overlay) {
        this._createOverlay();
        overlay = document.getElementById('paywall-overlay');
      } else {
        overlay.style.display = 'flex';
      }
      document.body.classList.add('paywall-open');
      requestAnimationFrame(() => requestAnimationFrame(() => overlay?.classList.add('paywall-show')));
    },
    hide() {
      const overlay = document.getElementById('paywall-overlay');
      if (!overlay) return;
      overlay.classList.add('paywall-closing');
      overlay.classList.remove('paywall-show');
      document.body.classList.remove('paywall-open');
      setTimeout(() => {
        overlay.style.display = 'none';
        overlay.classList.remove('paywall-closing');
      }, 380);
    },
    _onSupport() {
      this.markPaid();
      this.hide();
      document.getElementById('nanxi-support-button')?.remove();
      this._showThanks();
    },
    _showThanks() {
      const toast = document.createElement('div');
      toast.className = 'paywall-toast';
      toast.textContent = '谢谢你的支持。故事继续，旧网页也继续留着。';
      document.body.appendChild(toast);
      setTimeout(() => toast.classList.add('show'), 40);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 380);
      }, 3000);
    },
    _createOverlay() {
      document.body.insertAdjacentHTML('beforeend', `
        <div class="paywall-overlay" id="paywall-overlay" role="dialog" aria-modal="true" aria-labelledby="paywall-title" style="display:flex">
          <div class="paywall-card">
            <button class="paywall-close" type="button" data-paywall-close aria-label="关闭支持弹层" title="关闭">&times;</button>
            <div class="paywall-card-inner">
              <div class="paywall-header">
                <div class="paywall-title-row">
                  <span class="paywall-heart">♡</span>
                  <span class="paywall-title" id="paywall-title">支持《南溪文学论坛最后一帖》</span>
                  <span class="paywall-heart">♡</span>
                </div>
                <div class="paywall-subtitle">1元 自愿支持 · 不影响后续游玩</div>
              </div>
              <div class="paywall-body">
                <div class="paywall-qr-wrapper">
                  <a href="${QR_CODE}" target="_blank" rel="noopener noreferrer" title="单独打开收款码">
                    <img src="${QR_CODE}" alt="1元支持收款码" class="paywall-qr-img" />
                  </a>
                  <div class="paywall-qr-glow"></div>
                </div>
                <div class="paywall-qr-tip">扫码自愿支持 1元 · 图片打不开时可点击二维码单独查看</div>
                <div class="paywall-message">
                  <p class="paywall-msg-warm">你好，我是 abc studio 的独立开发者。</p>
                  <p class="paywall-msg-body">这部作品里的旧论坛、小说、学校网页、书店和出版社，都是一页一页慢慢做出来的。<br>如果你愿意支持 <strong>1元</strong>，会成为我继续做下一部作品很实在的动力。</p>
                  <p class="paywall-msg-cute">不支持也完全不影响游戏，关掉继续看就好。</p>
                  <p class="paywall-msg-warm2">谢谢你愿意花时间读到这里。</p>
                </div>
              </div>
              <div class="paywall-footer">
                <div class="paywall-hint"><span class="paywall-hint-icon">※</span><span>支持记录保存在本机浏览器；清除浏览器数据后，系统可能再次显示这层。</span></div>
                <div class="paywall-btns">
                  <button class="paywall-btn paywall-btn-support" type="button" data-paywall-support>已完成支持 ♡</button>
                  <button class="paywall-btn paywall-btn-later" type="button" data-paywall-close>下次一定</button>
                </div>
              </div>
              <div class="paywall-studio">abc studio</div>
            </div>
          </div>
        </div>`);
      const overlay = document.getElementById('paywall-overlay');
      overlay?.querySelectorAll('[data-paywall-close]').forEach(btn => btn.addEventListener('click', () => this.hide()));
      overlay?.querySelector('[data-paywall-support]')?.addEventListener('click', () => this._onSupport());
      overlay?.addEventListener('click', (e) => { if (e.target === overlay) this.hide(); });
    }
  };
  window.Paywall = Paywall;

  const currentPath = location.pathname.toLowerCase();
  const isBookshop = currentPath.endsWith('/bookshop/index.html') || currentPath.endsWith('/bookshop/');

  const ensureSupportButton = () => {
    if (Paywall.hasPaid() || document.getElementById('nanxi-support-button')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'nanxi-support-button';
    btn.className = 'nanxi-support-button';
    btn.textContent = '支持作者 1元';
    btn.title = '自愿支持作者，不影响游玩';
    btn.addEventListener('click', () => Paywall.show());
    document.body.appendChild(btn);
  };

  // Before the player reaches Xiaoman Bookshop, there is no support button at all:
  // the first half remains fully immersive. After the one-time prompt has appeared,
  // a small manual button stays available on later pages without auto-opening again.
  if (safeGet(localStorage, AUTO_KEY)) ensureSupportButton();

  const maybeAutoShow = () => {
    if (Paywall.hasPaid() || safeGet(localStorage, AUTO_KEY) || !isBookshop) return;
    const showOnce = () => {
      if (Paywall.hasPaid() || safeGet(localStorage, AUTO_KEY)) return;
      safeSet(localStorage, AUTO_KEY, String(Date.now()));
      ensureSupportButton();
      Paywall.show();
    };
    const open = () => setTimeout(showOnce, 2000);
    if (document.visibilityState === 'visible') open();
    else document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') open();
    }, { once: true });
  };
  maybeAutoShow();

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('paywall-overlay')?.classList.contains('paywall-show')) Paywall.hide();
  });
})();
