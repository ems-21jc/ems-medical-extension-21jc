const FIELDS = [
  {
    label: "Date visite médicale",
    format: "date",
  },
  {
    label: "Date du don de sang",
    format: "datetime",
  },
  {
    label: "Date de visite de contrôle",
    format: "control",
  },
];

function localDateParts(date) {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((p) => [p.type, p.value]));
}

function formatDate() {
  const p = localDateParts(new Date());
  return `${p.day}/${p.month}/${p.year}`;
}

function formatDateTime() {
  const p = localDateParts(new Date());
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`;
}

// Parse une date/heure au format "DD/MM/YYYY hh:mm" → Date (heure locale)
function parseAdmissionDate(str) {
  const [datePart, timePart = "00:00"] = str.trim().split(/\s+/);
  const [day, month, year] = datePart.split("/").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hour || 0, minute || 0);
}

// Date d'admission + durée HH:MM:SS du champ "Durée d'invalidité"
// Retourne { value, error } pour éviter alert() qui provoque un re-render React
function formatControlDate() {
  const dureeInput = findInputByLabel("Durée d'invalidité");
  if (!dureeInput || !dureeInput.value.trim()) {
    return { value: null, error: 'Remplis "Durée d\'invalidité" (HH:MM:SS)' };
  }
  const admissionInput = findInputByLabel("Date d'admission");
  if (!admissionInput || !admissionInput.value.trim()) {
    return { value: null, error: 'Remplis "Date d\'admission" d\'abord' };
  }
  const parts = dureeInput.value.trim().split(":");
  if (parts.length < 2) {
    return { value: null, error: "Format invalide — attendu HH:MM:SS" };
  }
  const totalSeconds =
    (parseInt(parts[0], 10) || 0) * 3600 +
    (parseInt(parts[1], 10) || 0) * 60 +
    (parseInt(parts[2], 10) || 0);

  const admissionDate = parseAdmissionDate(admissionInput.value.trim());
  if (isNaN(admissionDate.getTime())) {
    return { value: null, error: "Date d'admission invalide (DD/MM/YYYY hh:mm)" };
  }

  const p = localDateParts(new Date(admissionDate.getTime() + totalSeconds * 1000));
  return { value: `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`, error: null };
}

// Compatible React : execCommand opère sous la couche synthétique de React,
// évitant les problèmes de re-render qui détachent l'élément entre le set et le dispatch
function setNativeValue(input, value) {
  input.focus();
  input.select();
  const ok = document.execCommand("insertText", false, value);
  if (!ok) {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype, "value",
    )?.set;
    if (setter) setter.call(input, value);
    else input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

function findInputByLabel(labelText) {
  for (const el of document.querySelectorAll('label, .label, [class*="label"]')) {
    if (el.textContent.trim().includes(labelText)) {
      if (el.htmlFor) {
        const input = document.getElementById(el.htmlFor);
        if (input) return input;
      }
      const parent = el.closest("div, fieldset, .field, .input-wrapper, .form-group");
      if (parent) {
        const input = parent.querySelector("input");
        if (input) return input;
      }
    }
  }
  for (const input of document.querySelectorAll("input")) {
    const placeholder = input.placeholder || "";
    const ariaLabel = input.getAttribute("aria-label") || "";
    if (placeholder.includes(labelText) || ariaLabel.includes(labelText)) {
      return input;
    }
  }
  return null;
}

function injectButton(input, format, label) {
  const wrapper = input.parentElement;
  // Vérifie dans tout le conteneur parent (MuiFormControl-root) si le bouton existe déjà
  const outer = wrapper.closest(".MuiFormControl-root, .MuiBox-root") || wrapper.parentElement;
  if (outer && outer.querySelector(".med-now-btn")) return;

  // Couleur de fond commune : #212121
  const BG_COLOR = "#212121";
  const BG_HOVER = "#2d2d2d";
  const BG_ACTIVE = "#1a1a1a";
  const BG_SUCCESS = "#2e7d32";
  const BG_ERROR = "#c62828";
  const BORDER_COLOR = "#4c6875";

  // VM (date) : bouton pleine largeur, fond #212121, SVG médical bleu (#29b6f6), bordure #4c6875
  // DDS (datetime) : bouton pleine largeur, fond #212121, SVG sang rouge (#ef5350), bordure #4c6875
  // VC (control) : petit bouton à DROITE du champ (en dessous), fond #212121, SVG actualiser blanc, bordure #4c6875

  if (format === "date") {
    // VM - Visite Médicale - bouton EN DESSOUS du champ, MÊME LARGEUR, AVEC ESPACEMENT
    const btnText = "VM Maintenant";
    const btnTitle = "Insérer date actuelle pour la visite médicale";
    // SVG médical (cross/heartbeat) - bleu #29b6f6
    const svgIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#29b6f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>`;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "med-now-btn med-now-btn--vm";
    btn.title = btnTitle;
    // Style : bouton pleine largeur, sans marge gauche/droite
    btn.style.cssText =
      "display:flex;align-items:center;justify-content:center;gap:8px;" +
      "width:100%;padding:10px 0;font-size:14px;font-weight:500;" +
      "color:#fff;background:" + BG_COLOR + ";border:1px solid " + BORDER_COLOR + ";border-radius:8px;" +
      "cursor:pointer;transition:all 0.15s ease;" +
      "font-family:inherit;white-space:nowrap;margin:8px 0;";
    btn.innerHTML = svgIcon + btnText;

    btn.addEventListener("mouseenter", () => {
      btn.style.background = BG_HOVER;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.background = BG_COLOR;
    });
    btn.addEventListener("mousedown", () => {
      btn.style.background = BG_ACTIVE;
    });
    btn.addEventListener("mouseup", () => {
      btn.style.background = BG_HOVER;
    });
    btn.addEventListener("click", () => {
      const currentInput = findInputByLabel(label);
      if (!currentInput) return;
      const value = formatDate();
      setNativeValue(currentInput, value);
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> OK`;
      btn.style.background = BG_SUCCESS;
      setTimeout(() => {
        btn.innerHTML = svgIcon + btnText;
        btn.style.background = BG_COLOR;
      }, 1500);
    });

    // Place le bouton DANS le MuiFormControl-root, APRÈS le MuiInputBase-root (EN DESSOUS de l'input)
    const inputBase = wrapper.closest(".MuiInputBase-root");
    if (inputBase) {
      inputBase.after(btn); // frère après l'input, dans le FormControl (colonne flex)
    } else {
      wrapper.after(btn);
    }
  }
  else if (format === "datetime") {
    // DDS - Don Du Sang - bouton EN DESSOUS du champ, MÊME LARGEUR, SANS MARGE GAUCHE/DROITE
    const btnText = "DDS Maintenant";
    const btnTitle = "Insérer date et heure actuelles pour le don du sang";
    // SVG sang (heart/blood drop) - rouge #ef5350
    const svgIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef5350" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-13-7-13S5 10.7 5 15a7 7 0 0 0 7 7z"></path></svg>`;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "med-now-btn med-now-btn--dds";
    btn.title = btnTitle;
    // Style : bouton pleine largeur, sans marge gauche/droite
    btn.style.cssText =
      "display:flex;align-items:center;justify-content:center;gap:8px;" +
      "width:100%;padding:10px 0;font-size:14px;font-weight:500;" +
      "color:#fff;background:" + BG_COLOR + ";border:1px solid " + BORDER_COLOR + ";border-radius:8px;" +
      "cursor:pointer;transition:all 0.15s ease;" +
      "font-family:inherit;white-space:nowrap;margin:8px 0;";
    btn.innerHTML = svgIcon + btnText;

    btn.addEventListener("mouseenter", () => {
      btn.style.background = BG_HOVER;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.background = BG_COLOR;
    });
    btn.addEventListener("mousedown", () => {
      btn.style.background = BG_ACTIVE;
    });
    btn.addEventListener("mouseup", () => {
      btn.style.background = BG_HOVER;
    });
    btn.addEventListener("click", () => {
      const currentInput = findInputByLabel(label);
      if (!currentInput) return;
      const value = formatDateTime();
      setNativeValue(currentInput, value);
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> OK`;
      btn.style.background = BG_SUCCESS;
      setTimeout(() => {
        btn.innerHTML = svgIcon + btnText;
        btn.style.background = BG_COLOR;
      }, 1500);
      const enregistrer = [...document.querySelectorAll("button")].find(
        (b) => b.textContent.trim().toLowerCase() === "enregistrer",
      );
      if (enregistrer) setTimeout(() => enregistrer.click(), 200);
    });

    // Place le bouton DANS le MuiFormControl-root, APRÈS le MuiInputBase-root (EN DESSOUS de l'input)
    const inputBase = wrapper.closest(".MuiInputBase-root");
    if (inputBase) {
      inputBase.after(btn); // frère après l'input, dans le FormControl (colonne flex)
    } else {
      wrapper.after(btn);
    }
  }
  else if (format === "control") {
    // VC - Visite de Contrôle - petit bouton À DROITE DU CHAMP (dans le MuiInputBase-root, même ligne, AVEC ESPACEMENT)
    const btnTitle = "Calculer la date de visite de contrôle (admission + durée)";
    // SVG actualiser (refresh) - blanc (currentColor)
    const svgIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>`;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "med-now-btn med-now-btn--vc";
    btn.title = btnTitle;
    // Style : petit bouton carré à droite du champ (même hauteur que l'input ~36px), avec marge gauche
    btn.style.cssText =
      "display:inline-flex;align-items:center;justify-content:center;" +
      "width:36px;height:36px;padding:0;margin-left:8px;" +
      "color:#fff;background:" + BG_COLOR + ";border:1px solid " + BORDER_COLOR + ";border-radius:8px;" +
      "cursor:pointer;transition:all 0.15s ease;" +
      "flex-shrink:0;";
    btn.innerHTML = svgIcon;

    btn.addEventListener("mouseenter", () => {
      btn.style.background = BG_HOVER;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.background = BG_COLOR;
    });
    btn.addEventListener("mousedown", () => {
      btn.style.background = BG_ACTIVE;
    });
    btn.addEventListener("mouseup", () => {
      btn.style.background = BG_HOVER;
    });
    btn.addEventListener("click", () => {
      const currentInput = findInputByLabel(label);
      if (!currentInput) return;

      const result = formatControlDate();
      if (result.error) {
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
        btn.title = result.error;
        btn.style.background = BG_ERROR;
        setTimeout(() => {
          btn.innerHTML = svgIcon;
          btn.title = btnTitle;
          btn.style.background = BG_COLOR;
        }, 2000);
        return;
      }
      setNativeValue(currentInput, result.value);
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
      btn.style.background = BG_SUCCESS;
      setTimeout(() => {
        btn.innerHTML = svgIcon;
        btn.style.background = BG_COLOR;
      }, 1500);
    });

    // Trouve le MuiInputBase-root (le conteneur du champ input + adornment calendrier)
    const inputBase = wrapper.closest(".MuiInputBase-root");
    if (inputBase) {
      // Crée un wrapper flex row autour de inputBase + bouton, AVEC GAP (8px)
      const row = document.createElement("div");
      row.style.cssText = "display:flex;gap:8px;align-items:center;width:100%;";
      inputBase.parentNode.insertBefore(row, inputBase);
      row.appendChild(inputBase);
      row.appendChild(btn);
      // inputBase prend flex:1, bouton reste taille fixe (36px)
      inputBase.style.flex = "1 1 0%";
      inputBase.style.minWidth = "0";
      
      // Masque le placeholder "DD/MM/YYYY hh:mm" pour le champ VC (format control)
      const input = inputBase.querySelector("input");
      if (input && input.placeholder) {
        input.placeholder = "";
      }
    } else {
      // Fallback : après le wrapper
      wrapper.after(btn);
    }
  }
}

function tryInjectDates() {
  for (const field of FIELDS) {
    const input = findInputByLabel(field.label);
    if (input) injectButton(input, field.format, field.label);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// Chips "Infos ok" / "Infos pas ok" — coloration + boutons d'ajout
// ════════════════════════════════════════════════════════════════════════════

function normalizeChipText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isInfosOk(text) {
  const t = normalizeChipText(text);
  if (t.includes("pas ok")) return false;
  if (t.includes("pasok")) return false;
  return /\binfo(?:s|rmation(?:s)?)?\s*ok\b/.test(t);
}

function isInfosPasOk(text) {
  const t = normalizeChipText(text);
  return /\binfo(?:s|rmation(?:s)?)?\s*pas\s*ok\b/.test(t) ||
    /\binfo(?:s|rmation(?:s)?)?\s*pasok\b/.test(t);
}

// Découpe un texte en segments colorables.
// Renvoie un tableau de {text, kind} où kind ∈ {null, 'ok', 'pas-ok'}
function splitInfoSegments(text) {
  const segments = [];
  const re = /\b(info(?:s|rmation(?:s)?)?\s*(?:pas\s*ok|pasok|ok))\b/gi;
  let lastIndex = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, m.index), kind: null });
    }
    const matched = m[0];
    segments.push({
      text: matched,
      kind: isInfosPasOk(matched) ? "pas-ok" : "ok",
    });
    lastIndex = m.index + matched.length;
  }
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), kind: null });
  }
  return segments;
}

// Colore les chips MUI ET le texte brut inline.
function colorizeInfosChips() {
  // 1) Chips MUI
  for (const chip of document.querySelectorAll(".MuiChip-root")) {
    if (chip.dataset.medColored === "1") continue;
    const label = chip.querySelector(".MuiChip-label");
    if (!label) continue;
    const text = label.textContent || "";
    if (isInfosPasOk(text)) {
      chip.classList.add("med-chip--pas-ok");
      chip.dataset.medColored = "1";
    } else if (isInfosOk(text)) {
      chip.classList.add("med-chip--ok");
      chip.dataset.medColored = "1";
    }
  }

  // 2) Texte brut inline (vue MuiBox css-a6vglj)
  for (const titleEl of document.querySelectorAll("h1, h2, h3, h4, h5, h6")) {
    if (normalizeChipText(titleEl.textContent) !== "en cas d'urgence") continue;
    const container = titleEl.parentElement;
    if (!container) continue;
    colorizeTextNodesIn(container);
  }
}

// Parcourt un conteneur, identifie les textNodes contenant
// "Infos ok" / "Infos pas ok" et les enveloppe dans un <span>.
// IMPORTANT : pour éviter que "Infos pas ok" soit isolé sur sa propre
// ligne (à cause du wrap naturel de la liste de contacts), on transfère
// le whitespace précédant le pattern dans le span (en nbsp) pour que
// ", Infos pas ok" reste insécable.
function colorizeTextNodesIn(root) {
  if (root.dataset.medTextColored === "1") return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) {
        return NodeFilter.FILTER_REJECT;
      }
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName;
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "INPUT" ||
          tag === "TEXTAREA" || tag === "BUTTON") {
        return NodeFilter.FILTER_REJECT;
      }
      if (parent.closest(".MuiChip-root")) {
        return NodeFilter.FILTER_REJECT;
      }
      if (parent.closest("[data-med-inline-colored]")) {
        return NodeFilter.FILTER_REJECT;
      }
      if (!/(info(?:s|rmation(?:s)?)?\s*(?:pas\s*ok|pasok|ok))/i.test(node.nodeValue)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const targets = [];
  let n;
  while ((n = walker.nextNode())) targets.push(n);

  for (const textNode of targets) {
    // Si le textNode a déjà été remplacé (par un span inline-colored),
    // on l'ignore pour éviter une boucle.
    if (textNode.parentElement && textNode.parentElement.dataset.medInlineColored) {
      continue;
    }

    const text = textNode.nodeValue;
    if (!/(infos? pas ok|infos? ok)/i.test(text)) continue;

    // Crée un span conteneur qui remplacera le textNode.
    // Le span est marqué data-med-inline-colored pour éviter retraitement.
    const container = document.createElement("span");
    container.dataset.medInlineColored = "true";

    // Split avec capture : chaque match est un élément du tableau
    text.split(/(infos? pas ok|infos? ok)/gi).forEach((part) => {
      if (!part) return;
      if (/^infos? pas ok$/i.test(part)) {
        const b = document.createElement("b");
        b.textContent = part;
        b.style.color = "#ef5350";
        b.style.whiteSpace = "nowrap";
        container.appendChild(b);
      } else if (/^infos? ok$/i.test(part)) {
        const b = document.createElement("b");
        b.textContent = part;
        b.style.color = "#66bb6a";
        b.style.whiteSpace = "nowrap";
        container.appendChild(b);
      } else {
        container.appendChild(document.createTextNode(part));
      }
    });

    textNode.parentNode.replaceChild(container, textNode);
  }
  root.dataset.medTextColored = "1";
}

// Injecte les deux boutons dans le conteneur MuiBox des contacts d'urgence.
function injectInfosButtons() {
  if (document.querySelector(".med-infos-btn")) return;

  let container = null;
  const iceInput = document.querySelector('input[name="ice"]');
  if (iceInput) {
    let c = iceInput.closest(".MuiFormControl-root") || iceInput.parentElement;
    for (let i = 0; i < 6 && c; i++) {
      const hasChips = c.querySelectorAll(".MuiChip-root").length > 0;
      const hasTitle = [...c.querySelectorAll("h1,h2,h3,h4,h5,h6")].some(
        (h) => normalizeChipText(h.textContent) === "en cas d'urgence",
      );
      if (hasChips || hasTitle) {
        container = c;
        break;
      }
      c = c.parentElement;
    }
    if (!container && iceInput.closest(".MuiFormControl-root")) {
      container = iceInput.closest(".MuiFormControl-root").parentElement;
    }
  }
  if (!container) return;

  // Le parent (MuiBox css-huskxe) est un flex row MUI, donc les éléments
  // frères s'alignent horizontalement. On encapsule le conteneur chips/ICE
  // + les boutons dans un wrapper vertical pour qu'ils soient bien empilés.
  const parent = container.parentElement;
  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.gap = "4px";
  wrapper.style.width = "100%";

  // Replace le container par le wrapper, puis remet le container dedans
  parent.insertBefore(wrapper, container);
  parent.removeChild(container);
  wrapper.appendChild(container);

  const btnGroup = document.createElement("div");
  btnGroup.className = "med-infos-btn-group";

  const btnOk = document.createElement("button");
  btnOk.type = "button";
  btnOk.className = "med-infos-btn med-infos-btn--ok";
  btnOk.textContent = "+ Infos ok";
  btnOk.title = "Ajouter « Infos ok » (retire « Infos pas ok » si présent)";
  btnOk.addEventListener("click", () => toggleInfoChip("Infos ok", btnOk));

  const btnPasOk = document.createElement("button");
  btnPasOk.type = "button";
  btnPasOk.className = "med-infos-btn med-infos-btn--pas-ok";
  btnPasOk.textContent = "+ Infos pas ok";
  btnPasOk.title = "Ajouter « Infos pas ok » (retire « Infos ok » si présent)";
  btnPasOk.addEventListener("click", () => toggleInfoChip("Infos pas ok", btnPasOk));

  btnGroup.appendChild(btnOk);
  btnGroup.appendChild(btnPasOk);
  wrapper.appendChild(btnGroup);
}

// Comportement des boutons :
//  1) Si le chip conceptuellement équivalent (info ok / info pas ok) est déjà présent → ne rien faire
//  2) Sinon, supprimer le chip de l'OPPOSÉ s'il existe (mutex)
//  3) Puis ajouter le chip cliqué via le champ Autocomplete
function toggleInfoChip(text, btn) {
  if (hasInfoChipInDom(text)) {
    btn.classList.add("med-infos-btn--done");
    setTimeout(() => btn.classList.remove("med-infos-btn--done"), 1200);
    return;
  }

  // Détermine l'opposé : si on veut "Infos pas ok", on supprime les chips info ok et vice-versa
  const isPasOk = text.toLowerCase().includes("pas");
  removeInfoChipsByConcept(isPasOk ? "ok" : "pas-ok");

  const iceInput = findInputByLabel("En cas d'urgence");
  if (iceInput) {
    iceInput.focus();
    const current = iceInput.value || "";
    const prefix = current.trim() ? " // " : "";
    const newValue = current + prefix + text;

    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype, "value",
    )?.set;
    if (setter) setter.call(iceInput, newValue);
    else iceInput.value = newValue;
    iceInput.dispatchEvent(new Event("input", { bubbles: true }));
    iceInput.dispatchEvent(new Event("change", { bubbles: true }));

    setTimeout(() => {
      iceInput.focus();
      iceInput.dispatchEvent(new KeyboardEvent("keydown", {
        key: "Enter", code: "Enter", keyCode: 13, which: 13,
        bubbles: true, cancelable: true,
      }));
      iceInput.dispatchEvent(new KeyboardEvent("keypress", {
        key: "Enter", code: "Enter", keyCode: 13, which: 13,
        bubbles: true, cancelable: true,
      }));
      iceInput.dispatchEvent(new KeyboardEvent("keyup", {
        key: "Enter", code: "Enter", keyCode: 13, which: 13,
        bubbles: true, cancelable: true,
      }));
      iceInput.blur();
    }, 80);
  }

  btn.classList.add("med-infos-btn--done");
  setTimeout(() => btn.classList.remove("med-infos-btn--done"), 1200);
}

// Vérifie la présence d'un chip MUI dont le label correspond au concept info ok / info pas ok
// (insensible à la casse, singulier/pluriel, etc.)
function hasInfoChipInDom(text) {
  const wantPasOk = text.toLowerCase().includes("pas");
  for (const chip of document.querySelectorAll(".MuiChip-root")) {
    const label = chip.querySelector(".MuiChip-label");
    if (!label) continue;
    const lbl = label.textContent || "";
    if (wantPasOk && isInfosPasOk(lbl)) return true;
    if (!wantPasOk && isInfosOk(lbl)) return true;
  }
  return false;
}

// Récupère les props React attachées à un élément DOM
function getReactProps(el) {
  const key = Object.keys(el).find((k) => k.startsWith("__reactProps$"));
  return key ? el[key] : null;
}

function getReactFiber(el) {
  const key = Object.keys(el).find((k) => k.startsWith("__reactFiber$"));
  return key ? el[key] : null;
}

function findClickHandler(el) {
  let fiber = getReactFiber(el);
  while (fiber) {
    if (fiber.memoizedProps && typeof fiber.memoizedProps.onClick === "function") {
      return fiber.memoizedProps.onClick;
    }
    fiber = fiber.return;
  }
  const props = getReactProps(el);
  if (props && typeof props.onClick === "function") return props.onClick;
  return null;
}

// Supprime les chips MUI correspondant au concept donné ('ok' ou 'pas-ok')
function removeInfoChipsByConcept(kind) {
  const chips = [...document.querySelectorAll(".MuiChip-root")];
  for (const chip of chips) {
    const label = chip.querySelector(".MuiChip-label");
    if (!label) continue;
    const lbl = label.textContent || "";
    const matches = kind === "ok" ? isInfosOk(lbl) : isInfosPasOk(lbl);
    if (!matches) continue;

    const del = chip.querySelector(".MuiChip-deleteIcon");
    if (!del) continue;

    const onClick = findClickHandler(del);
    if (onClick) {
      try {
        onClick({
          type: "click",
          bubbles: true,
          cancelable: true,
          currentTarget: del,
          target: del,
          preventDefault() {},
          stopPropagation() {},
        });
      } catch (e) {
        console.warn("[med-infos] onClick handler failed:", e);
      }
    }
    try {
      del.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true, view: window }),
      );
      del.click();
    } catch (e) {}
  }
}

function tryInjectInfos() {
  colorizeInfosChips();
  injectInfosButtons();
}

// ════════════════════════════════════════════════════════════════════════════
// Randomizer 🎲 Groupe Sanguin (popup examen médical)
// ════════════════════════════════════════════════════════════════════════════

const BLOOD_GROUPS = ["AB +", "AB -", "A +", "A -", "B +", "B -", "O +", "O -"];

function injectBloodGroupRandomizer() {
  for (const label of document.querySelectorAll('label[id="level-label"]')) {
    const text = (label.firstChild?.textContent || label.textContent).trim();
    if (text !== "Goupe Sanguin") continue;

    const parent = label.closest(".MuiFormControl-root");
    if (!parent) continue;
    if (parent.querySelector(".med-blood-rnd")) return;

    // Constantes de style identiques aux autres boutons (VC, VM, DDS)
    const BG_COLOR = "#212121";
    const BG_HOVER = "#2d2d2d";
    const BG_ACTIVE = "#1a1a1a";
    const BG_SUCCESS = "#2e7d32";
    const BORDER_COLOR = "#4c6875";

    // SVG aléatoire / shuffle (deux flèches croisées)
    const svgRandom = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>`;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "med-blood-rnd";
    btn.title = "Randomiser groupe sanguin";
    btn.innerHTML = svgRandom;
    btn.style.cssText =
      "display:inline-flex;align-items:center;justify-content:center;" +
      "width:36px;height:36px;padding:0;" +
      "color:#fff;background:" + BG_COLOR + ";border:1px solid " + BORDER_COLOR + ";border-radius:8px;" +
      "cursor:pointer;transition:all 0.15s ease;" +
      "flex-shrink:0;";

    btn.addEventListener("mouseenter", () => {
      btn.style.background = BG_HOVER;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.background = BG_COLOR;
    });
    btn.addEventListener("mousedown", () => {
      btn.style.background = BG_ACTIVE;
    });
    btn.addEventListener("mouseup", () => {
      btn.style.background = BG_HOVER;
    });
    btn.addEventListener("click", () => {
      const group = BLOOD_GROUPS[Math.floor(Math.random() * BLOOD_GROUPS.length)];
      const nativeInput = parent.querySelector('input[name="bloodgroup"]');
      const valueNoSpace = group.replace(/\s+/g, "");
      if (nativeInput) {
        nativeInput.value = valueNoSpace;
        nativeInput.dispatchEvent(new Event("change", { bubbles: true }));
        nativeInput.dispatchEvent(new Event("input", { bubbles: true }));
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
        if (setter) setter.call(nativeInput, valueNoSpace);
      }
      const combobox = parent.querySelector('[role="combobox"]');
      if (combobox) {
        combobox.textContent = group;
        combobox.dispatchEvent(new Event("input", { bubbles: true }));
        combobox.dispatchEvent(new Event("change", { bubbles: true }));
      }
      // Feedback visuel succès (✓ vert) comme les autres boutons
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
      btn.style.background = BG_SUCCESS;
      setTimeout(() => {
        btn.innerHTML = svgRandom;
        btn.style.background = BG_COLOR;
      }, 1200);
    });

    // Même placement que VC : à droite du champ, dans un flex row avec gap 8px
    const inputBase = parent.querySelector(".MuiInputBase-root");
    if (inputBase) {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;gap:8px;align-items:center;width:100%;";
      inputBase.parentNode.insertBefore(row, inputBase);
      row.appendChild(inputBase);
      row.appendChild(btn);
      inputBase.style.flex = "1 1 0%";
      inputBase.style.minWidth = "0";
    } else {
      parent.appendChild(btn);
    }
    return;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// Auto‑remplissage de la date d'admission à l'ouverture du formulaire
// ════════════════════════════════════════════════════════════════════════════

function autoFillAdmissionDate() {
  // Cible le champ "Date d'admission" dans la popup "Nouveau rapport médical"
  const admissionInput = document.querySelector(
    'input[name="admission"]'
  ) || findInputByLabel("Date d'admission");
  if (!admissionInput) return;

  // Ne remplir que si le champ est vide (évite d'écraser une valeur existante)
  if (admissionInput.value.trim()) return;

  // Vérifie qu'on est bien dans un formulaire "Nouveau rapport médical"
  const dialog = admissionInput.closest('[role="dialog"], .MuiDialog-paper');
  if (!dialog) return;
  if (!dialog.textContent.toLowerCase().includes("nouveau rapport medical")) return;

  const p = localDateParts(new Date());
  const value = `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`;
  setNativeValue(admissionInput, value);
}

// ════════════════════════════════════════════════════════════════════════════

const datesObserver = new MutationObserver(() => {
  tryInjectDates();
  tryInjectInfos();
  autoFillAdmissionDate();
  injectBloodGroupRandomizer();
});

datesObserver.observe(document.body, { childList: true, subtree: true });

tryInjectDates();
tryInjectInfos();
autoFillAdmissionDate();
injectBloodGroupRandomizer();
