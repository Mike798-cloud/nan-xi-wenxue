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


/* Nanxi voluntary support layer.
 * Interaction model follows the 1-yuan support flow used in Songtao Grainstation,
 * with Nanxi-specific wording and a one-time auto trigger after chapter 3.
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

  const isForumSurface = document.documentElement.dataset.site === 'forum';
  const currentPath = location.pathname.toLowerCase();
  const isForumHome = isForumSurface && (currentPath.endsWith('/') || currentPath.endsWith('/index.html'));
  const isReaderProfile = isForumSurface && currentPath.endsWith('/reader/index.html');
  if ((isForumHome || isReaderProfile) && !Paywall.hasPaid()) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'nanxi-support-button';
    btn.className = 'nanxi-support-button';
    btn.textContent = '支持作者 1元';
    btn.title = '自愿支持作者，不影响游玩';
    btn.addEventListener('click', () => Paywall.show());
    document.body.appendChild(btn);
  }

  const maybeAutoShow = () => {
    if (Paywall.hasPaid() || safeGet(localStorage, AUTO_KEY)) return;
    const path = location.pathname.toLowerCase();
    const onRiver = path.endsWith('/forum/river.html') || path.endsWith('forum/river.html');
    const onReader = path.endsWith('/reader/index.html') || path.endsWith('reader/index.html');
    const chapter = Number(new URLSearchParams(location.search).get('chapter') || 1);
    if (!(onRiver && chapter >= 4) && !onReader) return;
    safeSet(localStorage, AUTO_KEY, String(Date.now()));
    const open = () => setTimeout(() => Paywall.show(), onReader ? 1000 : 1500);
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

