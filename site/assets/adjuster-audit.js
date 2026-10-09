(() => {
  'use strict';
  const root = document.querySelector('.adjuster-audit-page');
  if (!root) return;
  root.classList.add('is-enhanced');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileLayout = window.matchMedia('(max-width: 720px)');

  // Kurumsal menü, JavaScript olmadan da bağlantıları görünür tutar.
  const menuToggle = root.querySelector('.menu-toggle');
  const menu = root.querySelector('#main-nav');
  const closeMenu = () => {
    if (!menuToggle || !menu) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Menüyü aç');
    menu.classList.remove('is-open');
  };
  menuToggle?.addEventListener('click', () => {
    if (!menu) return;
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
    menu.classList.toggle('is-open', open);
  });
  menu?.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  root.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menuToggle?.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuToggle.focus();
    }
  });
  mobileLayout.addEventListener('change', closeMenu);

  // Yerel bağlantılar tarayıcının doğal geçmiş ve odak davranışını korur.
  root.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      const offset = root.querySelector('.product-nav').getBoundingClientRect().height + 24;
      const top = window.scrollY + target.getBoundingClientRect().top - offset;
      window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion.matches ? 'instant' : 'smooth' });
      if (window.location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      closeMenu();
    });
  });

  // Kaydırma girişi engellenmez; yalnızca aktif görsel güncellenir.
  const steps = [...root.querySelectorAll('[data-step]')];
  const scenes = [...root.querySelectorAll('[data-scene]')];
  const stepLinks = [...root.querySelectorAll('[data-step-link]')];
  const progress = root.querySelector('.journey-progress > span');
  const sceneCount = root.querySelector('#scene-count');
  const sectionLinks = [...root.querySelectorAll('[data-section]')];
  const sections = sectionLinks.map(link => document.getElementById(link.dataset.section));
  let currentStep = -1;
  let rafPending = false;
  function setStep(index) {
    if (index === currentStep) return;
    currentStep = index;
    scenes.forEach((scene, i) => {
      scene.classList.toggle('is-active', i === index);
      scene.setAttribute('aria-hidden', String(i !== index));
    });
    stepLinks.forEach((link, i) => {
      if (i === index) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });
    progress.style.width = `${(index + 1) * 25}%`;
    sceneCount.textContent = `${String(index + 1).padStart(2, '0')} / 04`;
  }
  function updateScrollState() {
    rafPending = false;
    const focusLine = Math.min(window.innerHeight * .4, 350);
    if (!mobileLayout.matches) {
      let index = 0;
      steps.forEach((step, i) => { if (step.getBoundingClientRect().top <= focusLine) index = i; });
      setStep(index);
    }
    let activeSection = -1;
    sections.forEach((section, i) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 180 && rect.bottom > 180) activeSection = i;
    });
    sectionLinks.forEach((link, i) => {
      if (i === activeSection) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  const scheduleScrollUpdate = () => {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(updateScrollState);
  };
  window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
  window.addEventListener('resize', scheduleScrollUpdate, { passive: true });
  setStep(0);
  updateScrollState();

  // WAI-ARIA sekme deseni: ok tuşları, Home, End ve doğal Tab geçişi.
  const tabList = root.querySelector('.role-tabs');
  const tabs = [...tabList.querySelectorAll('[data-role]')];
  const rolePanels = [...root.querySelectorAll('[data-role-panel]')];
  tabList.setAttribute('role', 'tablist');
  tabs.forEach(tab => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', `rol-${tab.dataset.role}`);
  });
  rolePanels.forEach(panel => {
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `tab-${panel.dataset.rolePanel}`);
    panel.setAttribute('tabindex', '0');
  });
  function setRole(index, focus = false) {
    tabs.forEach((tab, i) => {
      tab.classList.toggle('is-active', i === index);
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    rolePanels.forEach((panel, i) => { panel.hidden = i !== index; });
    if (focus) tabs[index].focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => setRole(index));
    tab.addEventListener('keydown', e => {
      let next = index;
      if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      else return;
      e.preventDefault();
      setRole(next, true);
    });
  });
  setRole(0);

  // Gerçek ürün ekranı, yerel dosyadan da çalışan erişilebilir diyalog.
  const dialog = root.querySelector('.report-dialog');
  const previewLink = root.querySelector('[data-open-report]');
  if (typeof dialog.showModal === 'function') {
    previewLink.setAttribute('aria-haspopup', 'dialog');
    previewLink.addEventListener('click', e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      dialog.showModal();
      root.classList.add('dialog-open');
    });
    dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => {
      const rect = dialog.getBoundingClientRect();
      if (e.target === dialog && (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom)) dialog.close();
    });
    dialog.addEventListener('close', () => {
      root.classList.remove('dialog-open');
      previewLink.focus({ preventScroll: true });
    });
  }

  // İçerik varsayılan olarak görünürdür. Hareket azaltma her zaman önceliklidir.
  const reveals = [...root.querySelectorAll('.reveal')];
  let revealObserver;
  function setupReveals() {
    revealObserver?.disconnect();
    reveals.forEach(el => el.classList.remove('is-waiting'));
    if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove('is-waiting');
        entry.target.classList.add('is-revealed');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: .08 });
    reveals.forEach(el => {
      if (el.getBoundingClientRect().top <= innerHeight) return;
      el.classList.add('is-waiting');
      revealObserver.observe(el);
    });
  }
  setupReveals();
  reducedMotion.addEventListener('change', setupReveals);

  // Dış analitik isteği yoktur. Entegrasyon için kişisel veri içermeyen olay.
  root.querySelectorAll('[data-cta]').forEach(link => {
    link.addEventListener('click', () => root.dispatchEvent(new CustomEvent('adjuster:cta', {
      bubbles: true, detail: { position: link.dataset.cta, destination: link.hash ? 'section' : 'demo-page' }
    })));
  });
})();
