/* 鶏白湯そば 灯 -AKARI-  共通スクリプト */
(() => {
  const body = document.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- ローダー（セッション中は初回のみ） ---------- */
  const loader = document.querySelector('.loader');
  const ready = () => body.classList.add('is-ready');

  let seen = false;
  try { seen = sessionStorage.getItem('akari-loaded') === '1'; } catch (e) { /* ストレージ不可 */ }

  if (!loader || seen || reduceMotion) {
    if (loader) loader.remove();
    requestAnimationFrame(ready);
  } else {
    const finish = () => {
      loader.classList.add('is-done');
      ready();
      try { sessionStorage.setItem('akari-loaded', '1'); } catch (e) { /* ストレージ不可 */ }
      setTimeout(() => loader.remove(), 1300);
    };
    window.addEventListener('load', () => setTimeout(finish, 1500));
    setTimeout(finish, 5000); // 読み込みが遅い場合の保険
  }

  /* ---------- ヘッダー ---------- */
  const header = document.querySelector('.site-header');
  const onScrollHeader = () => header && header.classList.toggle('is-scrolled', window.scrollY > 40);
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* ---------- モバイルナビ ---------- */
  const toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const open = body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  /* ---------- 1文字ずつ分割 ---------- */
  document.querySelectorAll('[data-split]').forEach((el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          [...child.textContent].forEach((ch) => {
            if (!ch.trim()) { frag.append(ch); return; }
            const span = document.createElement('span');
            span.className = 'split-char';
            span.style.setProperty('--i', i++);
            span.textContent = ch;
            frag.append(span);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ''));
    walk(el);
  });

  /* ---------- スクロール出現 ---------- */
  const revealTargets = document.querySelectorAll('[data-reveal], [data-split]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- 数字カウントアップ ---------- */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    const countIo = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = Number(el.dataset.count);
        const duration = reduceMotion ? 0 : 1800;
        const start = performance.now();
        const tick = (now) => {
          const p = duration ? Math.min((now - start) / duration, 1) : 1;
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        countIo.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => countIo.observe(el));
  }

  /* ---------- パララックス ---------- */
  const parallaxEls = [...document.querySelectorAll('[data-parallax]')];
  if (parallaxEls.length && !reduceMotion) {
    let ticking = false;
    const update = () => {
      const vh = window.innerHeight;
      parallaxEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const offset = (rect.top + rect.height / 2 - vh / 2) * Number(el.dataset.parallax);
        el.style.translate = `0 ${offset.toFixed(1)}px`;
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ---------- カードの3Dチルト ---------- */
  if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-6px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ---------- お品書きタブ ---------- */
  const tabs = document.querySelectorAll('.menu-tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        const selected = t === tab;
        t.setAttribute('aria-selected', String(selected));
        document.getElementById(t.getAttribute('aria-controls')).hidden = !selected;
      });
    });
  });

  /* ---------- トップへ戻る ---------- */
  document.querySelectorAll('.to-top').forEach((el) => {
    const toTop = () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    el.addEventListener('click', toTop);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toTop(); }
    });
  });

  /* ---------- ページ遷移アニメーション ---------- */
  if (!reduceMotion) {
    document.querySelectorAll('a[href$=".html"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || link.target === '_blank') return;
        const url = new URL(link.href, location.href);
        if (url.pathname === location.pathname) return;
        e.preventDefault();
        body.classList.remove('nav-open');
        body.classList.add('is-leaving');
        setTimeout(() => { location.href = link.href; }, 550);
      });
    });
  }
  // ブラウザの「戻る」でキャッシュから復帰したとき
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) body.classList.remove('is-leaving');
  });
})();
