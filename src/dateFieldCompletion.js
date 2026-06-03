import browser from 'webextension-polyfill';

const FIELDS = [
  {
    label: 'Date visite médicale',
    format: 'date',
  },
  {
    label: 'Date du don de sang',
    format: 'datetime',
  },
  {
    label: 'Date de visite de contrôle',
    format: 'control',
  },
];

function formatDate() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${d}/${m}/${y}`;
}

function formatDateTime() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${d}/${m}/${y} ${h}:${min}`;
}

// Date actuelle + durée HH:MM:SS du champ "Durée d'invalidité"
// Retourne { value, error } pour éviter alert() qui provoque un re-render React
function formatControlDate() {
  const dureeInput = findInputByLabel("Durée d'invalidité");
  if (!dureeInput || !dureeInput.value.trim()) {
    return { value: null, error: 'Remplis "Durée d\'invalidité" (HH:MM:SS)' };
  }
  const parts = dureeInput.value.trim().split(':');
  if (parts.length < 2) {
    return { value: null, error: 'Format invalide — attendu HH:MM:SS' };
  }
  const now = new Date();
  now.setHours(now.getHours() + (parseInt(parts[0], 10) || 0));
  now.setMinutes(now.getMinutes() + (parseInt(parts[1], 10) || 0));
  now.setSeconds(now.getSeconds() + (parseInt(parts[2], 10) || 0));
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return { value: `${d}/${m}/${now.getFullYear()} ${h}:${min}`, error: null };
}

// Compatible React : execCommand opère sous la couche synthétique de React,
// évitant les problèmes de re-render qui détachent l'élément entre le set et le dispatch
function setNativeValue(input, value) {
  input.focus();
  input.select();
  const ok = document.execCommand('insertText', false, value);
  if (!ok) {
    // Fallback si execCommand non supporté
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (setter) setter.call(input, value);
    else input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

function findInputByLabel(labelText) {
  // Cherche un élément label contenant ce texte
  for (const el of document.querySelectorAll('label, .label, [class*="label"]')) {
    if (el.textContent.trim().includes(labelText)) {
      // Cherche l'input associé : via htmlFor, ou input frère/enfant
      if (el.htmlFor) {
        const input = document.getElementById(el.htmlFor);
        if (input) return input;
      }
      const parent = el.closest('div, fieldset, .field, .input-wrapper, .form-group');
      if (parent) {
        const input = parent.querySelector('input');
        if (input) return input;
      }
    }
  }

  // Fallback : cherche un input dont le placeholder ou aria-label correspond
  for (const input of document.querySelectorAll('input')) {
    const placeholder = input.placeholder || '';
    const ariaLabel = input.getAttribute('aria-label') || '';
    if (placeholder.includes(labelText) || ariaLabel.includes(labelText)) {
      return input;
    }
  }

  return null;
}

function injectButton(input, format, label) {
  // Évite d'injecter deux fois
  if (input.parentElement.querySelector('.med-now-btn')) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'med-now-btn';
  btn.textContent = '🔃';
  btn.title = format === 'datetime' ? 'Insérer date et heure actuelles' : 'Insérer date actuelle';

  btn.addEventListener('click', () => {
    // Re-cherche l'input au moment du clic pour éviter les références obsolètes après re-render
    const currentInput = findInputByLabel(label);
    if (!currentInput) return;

    let value;
    if (format === 'control') {
      const result = formatControlDate();
      if (result.error) {
        btn.textContent = '⚠';
        btn.title = result.error;
        btn.classList.add('med-now-btn--error');
        setTimeout(() => {
          btn.textContent = '🔃';
          btn.title = "Insérer date actuelle + durée d'invalidité";
          btn.classList.remove('med-now-btn--error');
        }, 2000);
        return;
      }
      value = result.value;
    } else {
      value = format === 'datetime' ? formatDateTime() : formatDate();
    }
    setNativeValue(currentInput, value);
    btn.textContent = '✓';
    btn.classList.add('med-now-btn--done');
    setTimeout(() => {
      btn.textContent = '🔃';
      btn.classList.remove('med-now-btn--done');
    }, 1500);
  });

  // Insère le bouton juste après l'input, sur la même ligne
  const wrapper = input.parentElement;
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';
  input.insertAdjacentElement('afterend', btn);
}

function tryInjectDates() {
  for (const field of FIELDS) {
    const input = findInputByLabel(field.label);
    if (input) injectButton(input, field.format, field.label);
  }
}

// Observe les mutations DOM pour les pages chargées dynamiquement (SPA/React)
const datesObserver = new MutationObserver(() => {
  tryInjectDates();
});

datesObserver.observe(document.body, { childList: true, subtree: true });

tryInjectDates();
