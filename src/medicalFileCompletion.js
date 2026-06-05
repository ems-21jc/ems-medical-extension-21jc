const storage = (typeof browser !== "undefined" ? browser : chrome).storage
  .local;

// Structure hiérarchique du formulaire de complétion
const COMPLETION_CONFIG = [
  {
    group: "Notes Internes",
    items: [
      { key: "vm", label: "VM" },
      { key: "sp", label: "SP", parent: "vm", level: 1 },
      { key: "valide", label: "Validé", parent: "vm", level: 1 },
      { key: "cu", label: "CU" },
    ],
  },
  {
    group: "Accident",
    items: [
      { key: "avp", label: "AVP" },
      {
        key: "moto",
        label: "Moto",
        parent: "avp",
        level: 1,
        disabledBy: ["pieton", "parebrise"],
      },
      { key: "casque", label: "Casque", parent: "moto", level: 2 },
      {
        key: "parebrise",
        label: "Pare Brise",
        parent: "avp",
        level: 1,
        disabledBy: ["moto", "pieton"],
      },
      {
        key: "pieton",
        label: "Piéton",
        parent: "avp",
        level: 1,
        disabledBy: ["moto", "parebrise"],
      },
      { key: "cb", label: "Coup & Blessure" },
      { key: "arme_blanche", label: "Arme Blanche", parent: "cb", level: 1 },
      { key: "arme_contondante", label: "Contondante", parent: "cb", level: 1 },
      { key: "bpb", label: "BPB" },
      { key: "gpb", label: "GPB", parent: "bpb", level: 1 },
      { key: "cat3", label: "Cat3", parent: "bpb", level: 1 },
      { key: "desydratation", label: "Désydratation" },
      { key: "hypoglycemie", label: "Hypoglycémie" },
      { key: "noyade", label: "Noyade" },
      { key: "depo", label: "Dépôt", parent: "noyade", level: 1 },
      { key: "chute", label: "Chute" },
      { key: "chute_15m", label: "15m", parent: "chute", level: 1 },
      { key: "explosion", label: "Explosion" },
      { key: "brulure", label: "Brulure" },
      { key: "attaque_animal", label: "Attaque Animal" },
    ],
  },
  {
    group: "Médicaments",
    items: [
      {
        key: "antidouleur",
        label: "Antidouleur",
        disabledBy: ["noyade"],
      },
      {
        key: "anti_inflammatoire",
        label: "Anti-Inflammatoire",
        disabledBy: ["noyade"],
      },
      { key: "antibiotique", label: "Antibiotique", disabledBy: ["noyade"] },
      { key: "anti_coagulant", label: "Anti-Coagulant" },
    ],
  },
  {
    group: "Autre",
    items: [
      { key: "coma", label: "Coma" },
      { key: "douleur", label: "Douleur", type: "slider", min: 0, max: 10, disabledBy: ["inconscient"] },
      { key: "inconscient", label: "Inconscient", requiresGroup: "Accident", disabledWhenNonZero: ["douleur"] },
      { key: "canne", label: "Canne" },
      { key: "fauteuil", label: "Fauteuil" },
    ],
  },
];

const COMPLETION_ITEMS = COMPLETION_CONFIG.flatMap((g) => g.items);

// Checkboxes d'incapacité — initialisées une seule fois au premier appel
let cbComa = null;
let cbSaut = null;
let cbCourse = null;
let cbConduire = null;
let cbArme = null;

function initIncapaciteCbs() {
  if (!cbComa) cbComa = findCheckboxByLabel("Coma");
  if (!cbSaut) cbSaut = findCheckboxByLabel("Incapacité de saut(1)");
  if (!cbCourse) cbCourse = findCheckboxByLabel("Incapacité de course(2)");
  if (!cbConduire)
    cbConduire = findCheckboxByLabel("Incapacité de conduire(3)");
  if (!cbArme)
    cbArme = findCheckboxByLabel("Incapacité d'utiliser une arme(4)");
}

function findCheckboxByLabel(labelText) {
  for (const el of document.querySelectorAll("label, span")) {
    if (el.textContent.trim() === labelText) {
      if (el.htmlFor) {
        const cb = document.getElementById(el.htmlFor);
        if (cb) return cb;
      }
      const parent = el.closest("div, span, label");
      if (parent) {
        const cb = parent.querySelector('input[type="checkbox"]');
        if (cb) return cb;
      }
      const prev = el.previousElementSibling;
      if (prev?.type === "checkbox") return prev;
      const next = el.nextElementSibling;
      if (next?.type === "checkbox") return next;
    }
  }
  return null;
}

// Cherche un input ou textarea associé à un label
function findFieldByLabel(labelText) {
  for (const el of document.querySelectorAll(
    'label, .label, [class*="label"]',
  )) {
    if (el.textContent.trim().includes(labelText)) {
      if (el.htmlFor) {
        const field = document.getElementById(el.htmlFor);
        if (field) return field;
      }
      const parent = el.closest("div, fieldset");
      if (parent) {
        const field = parent.querySelector(
          'textarea, input:not([type="checkbox"])',
        );
        if (field) return field;
      }
    }
  }
  for (const field of document.querySelectorAll("textarea, input")) {
    const p = field.placeholder || "";
    const a = field.getAttribute("aria-label") || "";
    if (p.includes(labelText) || a.includes(labelText)) return field;
  }
  return null;
}

// Ajoute du texte à la fin d'un champ (compatible React via execCommand)
function appendToField(labelText, text, separator = " // ") {
  const field = findFieldByLabel(labelText);
  if (!field) return;
  field.focus();
  field.setSelectionRange(field.value.length, field.value.length);
  const prefix = field.value.trim() ? separator : "";
  document.execCommand("insertText", false, prefix + text);
}

// Sélectionne une option dans un Select MUI : ouvre le dropdown puis clique l'option
function setSelectOption(labelText, optionText) {
  const openAndSelect = (trigger) => {
    trigger.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
    );
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
  for (const label of document.querySelectorAll("label")) {
    const text = (label.firstChild?.textContent || label.textContent).trim();
    if (text === labelText || text.startsWith(labelText)) {
      const parent = label.parentElement;
      if (!parent) continue;
      const combobox = parent.querySelector('[role="combobox"]');
      if (combobox) {
        openAndSelect(combobox);
        return;
      }
    }
  }
}

// Remplace le contenu d'un champ (compatible React via execCommand)
function setFieldValue(labelText, value) {
  const field = findFieldByLabel(labelText);
  if (!field) return;
  field.focus();
  field.select();
  document.execCommand("insertText", false, value);
}

// Remplit Durée d'invalidité ET recalcule Date de visite de contrôle
function setDuration(durationStr) {
  setFieldValue("Durée d'invalidité", durationStr);
  setFieldValue(
    "Date de visite de contrôle",
    calcDateFromDuration(durationStr),
  );
}

function localDateParts(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return {
    year: String(date.getFullYear()),
    month: pad(date.getMonth() + 1),
    day: pad(date.getDate()),
    hour: pad(date.getHours()),
    minute: pad(date.getMinutes()),
  };
}

// Calcule date actuelle + durée HH:MM:SS → format DD/MM/YYYY HH:MM (heure locale)
function calcDateFromDuration(durationStr) {
  const parts = durationStr.split(":");
  const totalSeconds =
    (parseInt(parts[0], 10) || 0) * 3600 +
    (parseInt(parts[1], 10) || 0) * 60 +
    (parseInt(parts[2], 10) || 0);
  const p = localDateParts(new Date(Date.now() + totalSeconds * 1000));
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`;
}

async function applyCompletion(sel) {
  initIncapaciteCbs();

  // ── Notes Internes ────────────────────────────────────────────────────────
  if (sel.vm || sel.cu) {
    try {
      // Récupère le ZIP configuré dans la popup, met 1057 si introuvable
      const data = await storage.get({ defaultHospitalZip: "1057" });
      const zipToApply = data.defaultHospitalZip || "1057";

      setFieldValue("Code Postal", zipToApply);
    } catch (error) {
      console.error("Erreur de lecture du stockage :", error);
      setFieldValue("Code Postal", "1057");
    }
  }

  if (sel.vm) {
    let remarque = "VISITE MÉDICALE // ";
    if (sel.sp)
      remarque +=
        (sel.valide ? "TEST EFFORT OK" : "TEST EFFORT ECHEC") + " // ";
    remarque += sel.valide
      ? "[APPROUVÉ AU SERVICE]"
      : "[NON APPROUVÉ AU SERVICE]";
    appendToField("Remarque(s)", remarque);
  }

  if (sel.cu) {
    appendToField("Remarque(s)", "Changement Contactes d'Urgence", " + ");
  }

  // ── Coma ──────────────────────────────────────────────────────────────────
  if (sel.coma) {
    if (cbComa && !cbComa.checked) cbComa.click();
  }

  // ── Blessures ─────────────────────────────────────────────────────────────
  const blessures = [];

  if (sel.vm) blessures.push("VM");
  if (sel.cu) blessures.push("CU");

  if (sel.avp) {
    let s = "AVP";
    if (sel.moto) {
      s += " Moto";
      s += sel.casque ? " Casque" : " sans Casque";
    }
    if (sel.parebrise) s += " Pare Brise";
    if (sel.pieton) s += " Piéton";
    blessures.push(s);
  }

  if (sel.cb) {
    if (sel.arme_blanche) blessures.push("Arme Blanche");
    else if (sel.arme_contondante) blessures.push("Arme Contondante");
    else blessures.push("Coup et Blessure");
  }

  if (sel.bpb) {
    let s = "BPB";
    s += sel.gpb ? " GPB" : " sans GPB";
    s += sel.cat3 ? " Cat3" : " 9mm";
    blessures.push(s);
    if (!sel.gpb || sel.coma) {
      [cbSaut, cbCourse, cbConduire, cbArme].forEach((cb) => {
        if (cb && !cb.checked) cb.click();
      });
    }
  }

  if (sel.desydratation) {
    blessures.push("Déshydratation");
    if (cbComa && !cbComa.checked) cbComa.click();
    appendToField("Examens", "Constantes: Faibles");
    appendToField("Traitements", "Poche de Solution Hydratante", " + ");
    if (cbSaut && !cbSaut.checked) cbSaut.click();
    if (cbCourse && !cbCourse.checked) cbCourse.click();
  }

  if (sel.hypoglycemie) {
    blessures.push("Hypoglycémie");
    if (cbComa && !cbComa.checked) cbComa.click();
    appendToField("Examens", "Constantes: Faibles");
    appendToField("Traitements", "Poche de Glucose", " + ");
    if (cbSaut && !cbSaut.checked) cbSaut.click();
    if (cbCourse && !cbCourse.checked) cbCourse.click();
  }
  if (sel.noyade) {
    blessures.push("Noyade");
    if (cbSaut && !cbSaut.checked) cbSaut.click();
    if (cbCourse && !cbCourse.checked) cbCourse.click();
  }

  if (sel.chute) {
    let s = "Chute";
    s += sel.chute_15m ? " 15m" : " -15m";
    blessures.push(s);
  }
  if (sel.explosion) blessures.push("Explosion");
  if (sel.brulure) blessures.push("Brulures");
  if (sel.attaque_animal) blessures.push("Attaque Animal");

  if (blessures.length)
    appendToField("Blessures", blessures.join(" + "), " + ");
  if (sel.douleur > 0)
    appendToField("Blessures", `// Douleur: ${sel.douleur}`, " ");
  if (sel.inconscient)
    appendToField("Blessures", "// Inconscient", " ");

  // ── Examens ───────────────────────────────────────────────────────────────
  if (sel.depo) appendToField("Examens", "Echo: Présence Dépot Poumon");

  // ── Traitements ───────────────────────────────────────────────────────────
  if (sel.noyade) {
    appendToField("Traitements", "AI + AD + AB + AF + Expectorant");
  } else {
    const soins = [];
    if (sel.antidouleur) soins.push("AD");
    if (sel.antibiotique) soins.push("AB");
    if (sel.anti_inflammatoire) soins.push("AI");
    if (sel.anti_coagulant) soins.push("AC");
    if (soins.length) appendToField("Traitements", soins.join(" + "));
  }

  if (sel.attaque_animal)
    appendToField("Traitements", "Vaccin Antirabique", " + ");

  // ── Durée d'invalidité & Date de contrôle — prend la valeur la plus élevée ─
  const durations = [];
  if (sel.desydratation || sel.hypoglycemie) durations.push("00:30:00");
  if (sel.noyade) durations.push(sel.coma ? "00:45:00" : "00:30:00");
  if (sel.attaque_animal) durations.push(sel.coma ? "00:45:00" : "00:30:00");
  if (sel.brulure && !sel.explosion)
    durations.push(sel.coma ? "00:45:00" : "00:30:00");
  if (sel.bpb && sel.coma) durations.push(sel.cat3 ? "04:00:00" : "03:00:00");
  if (sel.explosion && sel.coma) durations.push("06:00:00");
  if (sel.chute && sel.chute_15m && sel.coma) durations.push("06:00:00");

  if (durations.length) {
    const toSec = (s) =>
      s
        .split(":")
        .reduce((acc, v, i) => acc + parseInt(v) * [3600, 60, 1][i], 0);
    const best = durations.reduce((a, b) => (toSec(a) >= toSec(b) ? a : b));
    setDuration(best);
  }

  // ── Remarque(s) ───────────────────────────────────────────────────────────
  if (sel.canne) appendToField("Remarque(s)", "Prêt de canne", " + ");
  if (sel.fauteuil) appendToField("Remarque(s)", "Prêt de fauteuil", " + ");

  // ── Type (select) — appelé en dernier après tous les focus() ─────────────
  if (sel.vm || sel.cu)
    setTimeout(() => setSelectOption("Type", "Note interne"), 50);
}

// Calcule si un item doit être désactivé en tenant compte de TOUTES ses contraintes
function computeDisabled(item, panel) {
  if (item.parent) {
    const parentCb = panel.querySelector(`#med-compl-${item.parent}`);
    if (parentCb && (parentCb.disabled || !parentCb.checked)) return true;
  }
  const list = Array.isArray(item.disabledBy)
    ? item.disabledBy
    : item.disabledBy
      ? [item.disabledBy]
      : [];
  if (
    list.some((key) => {
      const cb = panel.querySelector(`#med-compl-${key}`);
      return cb && cb.checked;
    })
  )
    return true;
  if (item.requiresGroup) {
    const groupItems =
      COMPLETION_CONFIG.find((g) => g.group === item.requiresGroup)?.items ||
      [];
    const anyChecked = groupItems.some((gi) => {
      const cb = panel.querySelector(`#med-compl-${gi.key}`);
      return cb && cb.checked && !cb.disabled;
    });
    if (!anyChecked) return true;
  }
  if (item.disabledWhenNonZero) {
    const keys = Array.isArray(item.disabledWhenNonZero) ? item.disabledWhenNonZero : [item.disabledWhenNonZero];
    if (keys.some((key) => {
      const el = panel.querySelector(`#med-compl-${key}`);
      return el && parseInt(el.value, 10) > 0;
    })) return true;
  }
  return false;
}

// Recalcule l'état de tous les items — plus simple et fiable qu'une propagation récursive
function updateAllStates(panel) {
  COMPLETION_ITEMS.forEach((item) => {
    const el = panel.querySelector(`#med-compl-${item.key}`);
    const row = el?.closest(".med-completion-row");
    if (!el) return;
    const newDisabled = computeDisabled(item, panel);
    if (newDisabled) {
      if (item.type === "slider") { el.value = 0; updateSliderDisplay(el); }
      else if (!el.disabled) el.checked = false;
    }
    el.disabled = newDisabled;
    if (row) row.classList.toggle("med-completion-row--disabled", newDisabled);
  });
}

function updateSliderDisplay(sliderEl) {
  const display = sliderEl.parentElement?.querySelector(".med-completion-slider-value");
  if (display) display.textContent = sliderEl.value;
}

function buildPanel() {
  const panel = document.createElement("div");
  panel.className = "med-completion-panel";
  panel.addEventListener("click", (e) => e.stopPropagation());

  for (const { group, items } of COMPLETION_CONFIG) {
    const groupEl = document.createElement("div");
    groupEl.className = "med-completion-group";

    const groupTitle = document.createElement("div");
    groupTitle.className = "med-completion-group-title";
    groupTitle.textContent = group + " :";
    groupEl.appendChild(groupTitle);

    for (const item of items) {
      const row = document.createElement("div");
      row.className = "med-completion-row";
      if (item.level) row.style.paddingLeft = item.level * 14 + "px";

      const startsDisabled = !!item.parent;

      const lbl = document.createElement("label");
      lbl.className = "med-completion-label";
      lbl.textContent = item.label;
      lbl.htmlFor = `med-compl-${item.key}`;

      if (item.type === "slider") {
        const slider = document.createElement("input");
        slider.type = "range";
        slider.id = `med-compl-${item.key}`;
        slider.className = "med-completion-slider";
        slider.dataset.key = item.key;
        slider.min = item.min ?? 0;
        slider.max = item.max ?? 10;
        slider.value = 0;
        slider.disabled = startsDisabled;
        if (startsDisabled) row.classList.add("med-completion-row--disabled");

        const valueDisplay = document.createElement("span");
        valueDisplay.className = "med-completion-slider-value";
        valueDisplay.textContent = "0";

        slider.addEventListener("input", () => {
          valueDisplay.textContent = slider.value;
          updateAllStates(panel);
        });

        row.appendChild(lbl);
        row.appendChild(slider);
        row.appendChild(valueDisplay);
      } else {
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.id = `med-compl-${item.key}`;
        cb.className = "med-completion-checkbox";
        cb.dataset.key = item.key;
        cb.disabled = startsDisabled;
        if (startsDisabled) row.classList.add("med-completion-row--disabled");

        cb.addEventListener("change", () => {
          updateAllStates(panel);
        });

        row.appendChild(lbl);
        row.appendChild(cb);
      }

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
    if (el.getAttribute("role") === "dialog") return el;
    if (
      el.classList &&
      [...el.classList].some(
        (c) =>
          c.startsWith("MuiPaper") ||
          c.startsWith("MuiDialog") ||
          c.startsWith("MuiCard"),
      )
    )
      return el;
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
  if (container.querySelector(".med-completion-btn")) return;

  if (window.getComputedStyle(container).position === "static") {
    container.style.position = "relative";
  }

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "med-completion-btn";
  btn.textContent = "Complétion";

  let panel = null;

  btn.addEventListener("click", () => {
    if (panel && panel.isConnected) {
      panel.remove();
      panel = null;
      btn.classList.remove("med-completion-btn--active");
      return;
    }

    panel = buildPanel();

    const closePanel = () => {
      panel.remove();
      panel = null;
      btn.classList.remove("med-completion-btn--active");
    };

    // Bouton Valider
    const validateBtn = document.createElement("button");
    validateBtn.type = "button";
    validateBtn.className = "med-completion-validate";
    validateBtn.textContent = "Valider";

    // C'est ici qu'on récupère correctement les cases cochées avant d'appeler applyCompletion
    validateBtn.addEventListener("click", async () => {
      const selections = {};
      panel.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
        selections[cb.dataset.key] = cb.checked;
      });
      panel.querySelectorAll('input[type="range"]').forEach((slider) => {
        selections[slider.dataset.key] = parseInt(slider.value, 10);
      });
      applyCompletion(selections);
      closePanel();
    });

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "med-completion-cancel";
    cancelBtn.textContent = "Annuler";
    cancelBtn.addEventListener("click", closePanel);

    const actions = document.createElement("div");
    actions.className = "med-completion-actions";
    actions.appendChild(cancelBtn);
    actions.appendChild(validateBtn);

    panel.appendChild(actions);
    btn.classList.add("med-completion-btn--active");
    btn.appendChild(panel);
  });

  container.appendChild(btn);

  // Aligne le bord droit du bouton avec celui du bouton Enregistrer
  setTimeout(() => {
    const enregistrerBtn = [...document.querySelectorAll("button")].find(
      (b) => b.textContent.trim().toLowerCase() === "enregistrer",
    );
    if (enregistrerBtn) {
      const containerRect = container.getBoundingClientRect();
      const enregistrerRect = enregistrerBtn.getBoundingClientRect();
      btn.style.right = containerRect.right - enregistrerRect.right + "px";
    }
  }, 0);
}

function tryInjectCompletion() {
  for (const el of document.querySelectorAll(
    'h1, h2, h3, h4, h5, [class*="title"], [class*="Title"]',
  )) {
    if (el.textContent.trim().includes("Nouveau rapport medical")) {
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
