const COMPLETION_ITEMS = [
  { key: 'coma', label: 'Coma' },
];

function findCheckboxByLabel(labelText) {
  for (const el of document.querySelectorAll('label, span')) {
    if (el.textContent.trim() === labelText) {
      if (el.htmlFor) {
        const cb = document.getElementById(el.htmlFor);
        if (cb) return cb;
      }
      const parent = el.closest('div, span, label');
      if (parent) {
        const cb = parent.querySelector('input[type="checkbox"]');
        if (cb) return cb;
      }
      const prev = el.previousElementSibling;
      if (prev?.type === 'checkbox') return prev;
      const next = el.nextElementSibling;
      if (next?.type === 'checkbox') return next;
    }
  }
  return null;
}

function applyCompletion(selections) {
  for (const item of COMPLETION_ITEMS) {
    if (!selections[item.key]) continue;
    const cb = findCheckboxByLabel(item.label);
    if (cb && !cb.checked) cb.click();
  }
}

function findModalContainer(titleEl) {
  let el = titleEl.parentElement;
  for (let i = 0; i < 12; i++) {
    if (!el) break;
    if (el.getAttribute('role') === 'dialog') return el;
    if (el.classList && [...el.classList].some(c =>
      c.startsWith('MuiPaper') || c.startsWith('MuiDialog') || c.startsWith('MuiCard')
    )) return el;
    el = el.parentElement;
  }
  el = titleEl.parentElement;
  for (let i = 0; i < 8; i++) {
    if (!el) break;
    const w = el.offsetWidth;
    if (w >= 400 && w <= 1200) return el;
    el = el.parentElement;
  }
  return titleEl.parentElement;
}

function injectCompletionButton(titleEl) {
  const container = findModalContainer(titleEl);
  if (container.querySelector('.med-completion-btn')) return;

  if (window.getComputedStyle(container).position === 'static') {
    container.style.position = 'relative';
  }

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'med-completion-btn';
  btn.textContent = 'Complétion';

  let panel = null;

  btn.addEventListener('click', () => {
    if (panel && panel.isConnected) {
      panel.remove();
      panel = null;
      btn.classList.remove('med-completion-btn--active');
      return;
    }

    panel = document.createElement('div');
    panel.className = 'med-completion-panel';

    // Stoppe la propagation pour que les clics dans le panel ne remontent pas au bouton
    panel.addEventListener('click', e => e.stopPropagation());

    // Une ligne par item
    for (const item of COMPLETION_ITEMS) {
      const row = document.createElement('div');
      row.className = 'med-completion-row';

      const lbl = document.createElement('label');
      lbl.className = 'med-completion-label';
      lbl.textContent = item.label;
      lbl.htmlFor = `med-compl-${item.key}`;

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = `med-compl-${item.key}`;
      cb.className = 'med-completion-checkbox';
      cb.dataset.key = item.key;

      row.appendChild(lbl);
      row.appendChild(cb);
      panel.appendChild(row);
    }

    const closePanel = () => {
      panel.remove();
      panel = null;
      btn.classList.remove('med-completion-btn--active');
    };

    const validateBtn = document.createElement('button');
    validateBtn.type = 'button';
    validateBtn.className = 'med-completion-validate';
    validateBtn.textContent = 'Valider';
    validateBtn.addEventListener('click', () => {
      const selections = {};
      panel.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        selections[cb.dataset.key] = cb.checked;
      });
      applyCompletion(selections);
      closePanel();
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'med-completion-cancel';
    cancelBtn.textContent = 'Annuler';
    cancelBtn.addEventListener('click', closePanel);

    const actions = document.createElement('div');
    actions.className = 'med-completion-actions';
    actions.appendChild(cancelBtn);
    actions.appendChild(validateBtn);

    panel.appendChild(actions);
    btn.classList.add('med-completion-btn--active');
    btn.appendChild(panel);
  });

  container.appendChild(btn);
}

function tryInjectCompletion() {
  for (const el of document.querySelectorAll('h1, h2, h3, h4, h5, [class*="title"], [class*="Title"]')) {
    if (el.textContent.trim().includes('Nouveau rapport medical')) {
      injectCompletionButton(el);
      break;
    }
  }
}

// Observe les mutations DOM pour les pages chargées dynamiquement (SPA/React)
const completionObserver = new MutationObserver(() => {
  tryInjectCompletion();
});

completionObserver.observe(document.body, { childList: true, subtree: true });

tryInjectCompletion();
