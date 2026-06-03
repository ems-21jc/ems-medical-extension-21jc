// Structure hiérarchique du formulaire de complétion
const COMPLETION_CONFIG = [
  {
    group: 'Notes Internes',
    items: [
      { key: 'vm',     label: 'VM' },
      { key: 'sp',     label: 'SP',     parent: 'vm', level: 1 },
      { key: 'valide', label: 'Validé', parent: 'vm', level: 1 },
      { key: 'cu',     label: 'CU' },
    ]
  },
  {
    group: 'Accident',
    items: [
      { key: 'avp',            label: 'AVP' },
      { key: 'moto',           label: 'Moto',             parent: 'avp',   level: 1 },
      { key: 'casque',         label: 'Casque ?',          parent: 'moto',  level: 2 },
      { key: 'parebrise',      label: 'Pare Brise ?',      parent: 'avp',   level: 1, disabledBy: 'moto' },
      { key: 'bpb',            label: 'BPB' },
      { key: 'gpb',            label: 'GPB ?',             parent: 'bpb',   level: 1 },
      { key: 'cat3',           label: 'Cat3 ?',            parent: 'bpb',   level: 1 },
      { key: 'desydratation',  label: 'Désydratation' },
      { key: 'noyade',         label: 'Noyade' },
      { key: 'depo',           label: 'Dépôt ?',           parent: 'noyade', level: 1 },
    ]
  },
  {
    group: 'Médicaments',
    items: [
      { key: 'antidouleur',        label: 'Antidouleur',        disabledBy: ['noyade', 'bpb'] },
      { key: 'anti_inflammatoire', label: 'Anti-Inflammatoire', disabledBy: ['noyade', 'bpb'] },
      { key: 'antibiotique',       label: 'Antibiotique',       disabledBy: ['noyade'] },
    ]
  },
  {
    group: 'Autre',
    items: [
      { key: 'coma',      label: 'Coma' },
      { key: 'canne',     label: 'Canne' },
      { key: 'fauteuil', label: 'Fauteuil' },
    ]
  }
];

const COMPLETION_ITEMS = COMPLETION_CONFIG.flatMap(g => g.items);

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

// Cherche un input ou textarea associé à un label
function findFieldByLabel(labelText) {
  for (const el of document.querySelectorAll('label, .label, [class*="label"]')) {
    if (el.textContent.trim().includes(labelText)) {
      if (el.htmlFor) {
        const field = document.getElementById(el.htmlFor);
        if (field) return field;
      }
      const parent = el.closest('div, fieldset');
      if (parent) {
        const field = parent.querySelector('textarea, input:not([type="checkbox"])');
        if (field) return field;
      }
    }
  }
  for (const field of document.querySelectorAll('textarea, input')) {
    const p = field.placeholder || '';
    const a = field.getAttribute('aria-label') || '';
    if (p.includes(labelText) || a.includes(labelText)) return field;
  }
  return null;
}

// Ajoute du texte à la fin d'un champ (compatible React via execCommand)
function appendToField(labelText, text, separator = ' // ') {
  const field = findFieldByLabel(labelText);
  if (!field) return;
  field.focus();
  field.setSelectionRange(field.value.length, field.value.length);
  const prefix = field.value.trim() ? separator : '';
  document.execCommand('insertText', false, prefix + text);
}

// Sélectionne une option dans un Select MUI : ouvre le dropdown puis clique l'option
function setSelectOption(labelText, optionText) {
  const openAndSelect = (trigger) => {
    trigger.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    setTimeout(() => {
      for (const opt of document.querySelectorAll('[role="option"]')) {
        if (opt.textContent.trim() === optionText) {
          opt.click();
          return;
        }
      }
    }, 100);
  };

  // Trouve le <label> dont le texte commence par labelText,
  // puis cherche un combobox dans son parent (FormControl commun)
  for (const label of document.querySelectorAll('label')) {
    const text = (label.firstChild?.textContent || label.textContent).trim();
    if (text === labelText || text.startsWith(labelText)) {
      const parent = label.parentElement;
      if (!parent) continue;
      const combobox = parent.querySelector('[role="combobox"]');
      if (combobox) { openAndSelect(combobox); return; }
    }
  }
}

// Remplace le contenu d'un champ (compatible React via execCommand)
function setFieldValue(labelText, value) {
  const field = findFieldByLabel(labelText);
  if (!field) return;
  field.focus();
  field.select();
  document.execCommand('insertText', false, value);
}

// Calcule date actuelle + durée HH:MM:SS → format DD/MM/YYYY HH:MM
function calcDateFromDuration(durationStr) {
  const parts = durationStr.split(':');
  const now = new Date();
  now.setHours(now.getHours()     + (parseInt(parts[0], 10) || 0));
  now.setMinutes(now.getMinutes() + (parseInt(parts[1], 10) || 0));
  now.setSeconds(now.getSeconds() + (parseInt(parts[2], 10) || 0));
  const d   = String(now.getDate()).padStart(2, '0');
  const m   = String(now.getMonth() + 1).padStart(2, '0');
  const h   = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${d}/${m}/${now.getFullYear()} ${h}:${min}`;
}

function applyCompletion(sel) {
  // ── Notes Internes ────────────────────────────────────────────────────────
  if (sel.vm || sel.cu) {
    setFieldValue('Code Postal', '1057');
    setTimeout(() => setSelectOption('Type', 'Note interne'), 50);
  }

  if (sel.vm) {
    let remarque = 'VISITE MÉDICALE // ';
    if (sel.sp) remarque += (sel.valide ? 'TEST EFFORT OK' : 'TEST EFFORT ECHEC') + ' // ';
    remarque += sel.valide ? '[APPROUVÉ AU SERVICE]' : '[NON APPROUVÉ AU SERVICE]';
    appendToField('Remarque(s)', remarque);
  }

  if (sel.cu) {
    appendToField('Remarque(s)', 'Changement Contactes d\'Urgence');
  }

  // ── Coma ──────────────────────────────────────────────────────────────────
  if (sel.coma) {
    const cb = findCheckboxByLabel('Coma');
    if (cb && !cb.checked) cb.click();
  }

  // ── Blessures ─────────────────────────────────────────────────────────────
  const blessures = [];

  if (sel.vm) blessures.push('VM');
  if (sel.cu) blessures.push('CU');

  if (sel.avp) {
    let s = 'AVP';
    if (sel.moto) {
      s += ' Moto';
      s += sel.casque ? ' Casque' : ' sans Casque';
    }
    if (sel.parebrise) s += ' Pare Brise';
    blessures.push(s);
  }

  if (sel.bpb) {
    let s = 'BPB';
    s += sel.gpb  ? ' GPB'   : ' sans GPB';
    s += sel.cat3 ? ' Cat3'  : ' 9mm';
    blessures.push(s);
  }

  if (sel.desydratation) {
    blessures.push('Déshydratation');
    appendToField('Examens', 'Constantes: Faible');
    appendToField('Traitements', 'Poche de Solution Hydratante', ' ');
    setFieldValue("Durée d'invalidité", '00:30:00');
    setFieldValue('Date de visite de contrôle', calcDateFromDuration('00:30:00'));
    const cbSaut   = findCheckboxByLabel('Incapacité de saut(1)');
    const cbCourse = findCheckboxByLabel('Incapacité de course(2)');
    if (cbSaut   && !cbSaut.checked)   cbSaut.click();
    if (cbCourse && !cbCourse.checked) cbCourse.click();
    setTimeout(() => setSelectOption('Type', 'Intervention'), 50);
  }
  if (sel.noyade)        blessures.push('Noyade');

  if (blessures.length) appendToField('Blessures', blessures.join(' // '));

  // ── Examens ───────────────────────────────────────────────────────────────
  if (sel.depo) appendToField('Examens', 'Echo: Présence Dépot Poumon');

  // ── Traitements ───────────────────────────────────────────────────────────
  if (sel.noyade) {
    // Noyade impose un traitement fixe et désactive les soins individuels
    appendToField('Traitements', '// AI + AD + AB + AF + Expectorant', ' ');
  } else {
    const soins = [];
    if (sel.antidouleur)        soins.push('AD');
    if (sel.antibiotique)       soins.push('AB');
    if (sel.anti_inflammatoire) soins.push('AI');
    if (soins.length) appendToField('Traitements', '// ' + soins.join(' + '), ' ');
  }

  // ── Remarque(s) ───────────────────────────────────────────────────────────
  if (sel.canne)     appendToField('Remarque(s)', 'Prêt de canne');
  if (sel.fauteuil) appendToField('Remarque(s)', 'Prêt de fauteuil');
}

// Met à jour l'état disabled des enfants d'un item et gère l'exclusion disabledBy
function updateChildStates(panel, changedKey, isChecked) {
  COMPLETION_ITEMS.forEach(item => {
    // Enfants directs dont le parent vient de changer
    if (item.parent === changedKey) {
      const cbEl = panel.querySelector(`#med-compl-${item.key}`);
      const row = cbEl?.closest('.med-completion-row');
      if (!cbEl) return;
      const parentDisabled = !isChecked;
      cbEl.disabled = parentDisabled;
      if (parentDisabled) cbEl.checked = false;
      if (row) row.classList.toggle('med-completion-row--disabled', parentDisabled);
      // Propage aux petits-enfants
      updateChildStates(panel, item.key, isChecked && cbEl.checked);
    }
    // Exclusion : disabledBy peut être une string ou un tableau
    const disabledByList = Array.isArray(item.disabledBy) ? item.disabledBy : (item.disabledBy ? [item.disabledBy] : []);
    if (disabledByList.includes(changedKey)) {
      const cbEl = panel.querySelector(`#med-compl-${item.key}`);
      const row = cbEl?.closest('.med-completion-row');
      if (!cbEl) return;
      cbEl.disabled = isChecked;
      if (isChecked) cbEl.checked = false;
      if (row) row.classList.toggle('med-completion-row--disabled', isChecked);
    }
  });
}

function buildPanel() {
  const panel = document.createElement('div');
  panel.className = 'med-completion-panel';
  panel.addEventListener('click', e => e.stopPropagation());

  for (const { group, items } of COMPLETION_CONFIG) {
    const groupEl = document.createElement('div');
    groupEl.className = 'med-completion-group';

    const groupTitle = document.createElement('div');
    groupTitle.className = 'med-completion-group-title';
    groupTitle.textContent = group + ' :';
    groupEl.appendChild(groupTitle);

    for (const item of items) {
      const row = document.createElement('div');
      row.className = 'med-completion-row';
      if (item.level) row.style.paddingLeft = (item.level * 14) + 'px';

      // Les enfants démarrent disabled jusqu'à ce que le parent soit coché
      const startsDisabled = !!item.parent;

      const lbl = document.createElement('label');
      lbl.className = 'med-completion-label';
      lbl.textContent = item.label;
      lbl.htmlFor = `med-compl-${item.key}`;

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = `med-compl-${item.key}`;
      cb.className = 'med-completion-checkbox';
      cb.dataset.key = item.key;
      cb.disabled = startsDisabled;
      if (startsDisabled) row.classList.add('med-completion-row--disabled');

      cb.addEventListener('change', () => {
        updateChildStates(panel, item.key, cb.checked);
      });

      row.appendChild(lbl);
      row.appendChild(cb);
      groupEl.appendChild(row);
    }

    panel.appendChild(groupEl);
  }

  return panel;
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

    panel = buildPanel();

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

  // Aligne le bord droit du bouton avec celui du bouton Enregistrer
  setTimeout(() => {
    const enregistrerBtn = [...document.querySelectorAll('button')]
      .find(b => b.textContent.trim().toLowerCase() === 'enregistrer');
    if (enregistrerBtn) {
      const containerRect = container.getBoundingClientRect();
      const enregistrerRect = enregistrerBtn.getBoundingClientRect();
      btn.style.right = (containerRect.right - enregistrerRect.right) + 'px';
    }
  }, 0);
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
