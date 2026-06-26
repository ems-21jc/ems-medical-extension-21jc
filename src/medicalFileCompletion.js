const storage = (typeof browser !== "undefined" ? browser : chrome).storage
  .local;

// Structure hierarchique du formulaire de completion
const COMPLETION_CONFIG = [
  {
    group: "Notes Internes",
    items: [
      { key: "vm", label: "VM" },
      { key: "sp", label: "SP", parent: "vm", level: 1 },
      { key: "valide", label: "Valide", parent: "vm", level: 1 },
      { key: "cu", label: "CU" },
      { key: "detatouage", label: "Detatouage" },
      { key: "detatouage_nombre", label: "Nombre", parent: "detatouage", level: 1, type: "text" },
      { key: "detatouage_zone", label: "Zone", parent: "detatouage", level: 1, type: "text" },
      { key: "detatouage_facture", label: "Facture $", parent: "detatouage", level: 1, type: "text" },
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
        disabledBy: ["pieton", "parebrise", "velo"],
      },
      { key: "casque", label: "Casque", parent: "moto", level: 2 },
      {
        key: "velo",
        label: "Velo",
        parent: "avp",
        level: 1,
        disabledBy: ["moto", "pieton", "parebrise"],
      },
      {
        key: "parebrise",
        label: "Pare Brise",
        parent: "avp",
        level: 1,
        disabledBy: ["moto", "pieton", "velo"],
      },
      {
        key: "pieton",
        label: "Pieton",
        parent: "avp",
        level: 1,
        disabledBy: ["moto", "parebrise", "velo"],
      },
      { key: "cb", label: "Coup & Blessure" },
      { key: "arme_blanche", label: "Arme Blanche", parent: "cb", level: 1 },
      { key: "arme_contondante", label: "Contondante", parent: "cb", level: 1 },
      { key: "bpb", label: "BPB" },
      { key: "gpb", label: "GPB", parent: "bpb", level: 1 },
      { key: "cat3", label: "Cat3", parent: "bpb", level: 1 },
      { key: "desydratation", label: "Desydratation" },
      { key: "hypoglycemie", label: "Hypoglycemie" },
      { key: "coma_ethylique", label: "Coma ethylique" },
      { key: "coma_ethylique_g", label: "Taux mg/L", parent: "coma_ethylique", level: 1, type: "text" },
      { key: "overdose", label: "Overdose" },
      { key: "overdose_drogue", label: "Type Drogue", parent: "overdose", level: 1, type: "text" },
      { key: "noyade", label: "Noyade" },
      { key: "depo", label: "Depot", parent: "noyade", level: 1 },
      { key: "intox_fumee", label: "Intox Fumee" },
      { key: "chute", label: "Chute" },
      { key: "chute_15m", label: "+15m", parent: "chute", level: 1 },
      { key: "explosion", label: "Explosion" },
      { key: "brulure", label: "Brulure" },
      { key: "attaque_animal", label: "Attaque Animal" },
    ],
  },
  {
    group: "Medicaments",
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
      {
        key: "douleur",
        label: "Douleur",
        type: "slider",
        min: 0,
        max: 10,
        disabledBy: ["inconscient"],
      },
      {
        key: "inconscient",
        label: "Inconscient",
        requiresGroup: "Accident",
        disabledWhenNonZero: ["douleur"],
      },
      { key: "canne", label: "Canne" },
      { key: "fauteuil", label: "Fauteuil" },
    ],
  },
];

const COMPLETION_ITEMS = COMPLETION_CONFIG.flatMap((g) => g.items);

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
    if (el.closest(".med-completion-btn")) continue;
    if (el.closest(".med-completion-wrapper")) continue;
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
      if (prev && prev.type === "checkbox") return prev;
      const next = el.nextElementSibling;
      if (next && next.type === "checkbox") return next;
    }
  }
  return null;
}

function findFieldByLabel(labelText) {
  for (const el of document.querySelectorAll(
    'label, .label, [class*="label"]',
  )) {
    if (el.closest(".med-completion-btn")) continue;
    if (el.closest(".med-completion-wrapper")) continue;
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

function appendToField(labelText, text, separator = " // ") {
  const field = findFieldByLabel(labelText);
  if (!field) return;
  field.focus();
  field.setSelectionRange(field.value.length, field.value.length);
  const prefix = field.value.trim() ? separator : "";
  document.execCommand("insertText", false, prefix + text);
}

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

  for (const label of document.querySelectorAll("label")) {
    const text = (label.firstChild && label.firstChild.textContent) || label.textContent;
    const trimmed = text.trim();
    if (trimmed === labelText || trimmed.startsWith(labelText)) {
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

function setFieldValue(labelText, value) {
  const field = findFieldByLabel(labelText);
  if (!field) return;
  field.focus();
  field.select();
  document.execCommand("insertText", false, value);
}

function setDuration(durationStr) {
  setFieldValue("Durée d'invalidité", durationStr);
  setFieldValue(
    "Date de visite de contrôle",
    calcDateFromDuration(durationStr),
  );
}

function localDateParts(date) {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((p) => [p.type, p.value]));
}

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

  if (sel.vm || sel.cu || sel.detatouage) {
    try {
      const data = await storage.get({ defaultHospitalZip: "1057" });
      const zipToApply = data.defaultHospitalZip || "1057";
      setFieldValue("Code Postal", zipToApply);
    } catch (error) {
      console.error("Erreur de lecture du stockage :", error);
      setFieldValue("Code Postal", "1057");
    }
  }

  if (sel.vm) {
    let remarque = "VISITE MEDICALE // ";
    if (sel.sp)
      remarque +=
        (sel.valide ? "TEST EFFORT OK" : "TEST EFFORT ECHEC") + " // ";
    remarque += sel.valide
      ? "[APPROUVE AU SERVICE]"
      : "[NON APPROUVE AU SERVICE]";
    appendToField("Remarque(s)", remarque);
  }

  if (sel.cu) {
    appendToField("Remarque(s)", "Changement Contactes d'Urgence", " + ");
  }

  if (sel.detatouage) {
    const nb = sel.detatouage_nombre || "[Nombre]";
    const zone = sel.detatouage_zone || "[Zone]";
    const facture = sel.detatouage_facture || "[Prix]";
    appendToField("Examens", `Detatouage ${nb} ${zone}`);
    appendToField("Traitements", "Creme anesthesiante + detatouage laser + creme cicatrisante // Bandages");
    appendToField("Remarque(s)", `Facture réalisée de ${facture}$ // VC a faire dans 24H`);
    const admissionField = findFieldByLabel("Date d'admission");
    if (admissionField && admissionField.value) {
      const parts = admissionField.value.split(" ");
      const dateParts = parts[0].split("/");
      const timeParts = (parts[1] || "00:00").split(":");
      const d = new Date(dateParts[2], dateParts[1] - 1, dateParts[0], timeParts[0] || 0, timeParts[1] || 0);
      d.setHours(d.getHours() + 24);
      const p = localDateParts(d);
      setFieldValue("Date de visite de contrôle", `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`);
    }
  }

  if (sel.coma) {
    if (cbComa && !cbComa.checked) cbComa.click();
  }

  const blessures = [];

  if (sel.vm) blessures.push("VM");
  if (sel.cu) blessures.push("CU");
  if (sel.detatouage) blessures.push("Detatouage");

  if (sel.avp) {
    let s = "AVP";
    if (sel.moto) {
      s += " Moto";
      s += sel.casque ? " Casque" : " sans Casque";
    }
    if (sel.velo) s += " Velo";
    if (sel.parebrise) s += " Pare Brise";
    if (sel.pieton) s += " Pieton";
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
    blessures.push("Deshydratation");
    if (cbComa && !cbComa.checked) cbComa.click();
    appendToField("Examens", "Constantes: Faibles");
    appendToField("Traitements", "Poche de Solution Hydratante", " + ");
    if (cbSaut && !cbSaut.checked) cbSaut.click();
    if (cbCourse && !cbCourse.checked) cbCourse.click();
  }

  if (sel.hypoglycemie) {
    blessures.push("Hypoglycemie");
    if (cbComa && !cbComa.checked) cbComa.click();
    appendToField("Examens", "Constantes: Faibles");
    appendToField("Traitements", "Poche de Glucose", " + ");
    if (cbSaut && !cbSaut.checked) cbSaut.click();
    if (cbCourse && !cbCourse.checked) cbCourse.click();
  }

  if (sel.coma_ethylique) {
    blessures.push("Coma ethylique");
    if (cbComa && !cbComa.checked) cbComa.click();
    if (cbSaut && !cbSaut.checked) cbSaut.click();
    if (cbCourse && !cbCourse.checked) cbCourse.click();
  }

  if (sel.overdose) {
    const drogue = sel.overdose_drogue || "[Type]";
    blessures.push(`Overdose de ${drogue}`);
    if (cbComa && !cbComa.checked) cbComa.click();
    if (cbSaut && !cbSaut.checked) cbSaut.click();
    if (cbCourse && !cbCourse.checked) cbCourse.click();
  }

  if (sel.noyade) {
    blessures.push("Noyade");
    if (cbSaut && !cbSaut.checked) cbSaut.click();
    if (cbCourse && !cbCourse.checked) cbCourse.click();
  }

  if (sel.intox_fumee) {
    blessures.push("Intoxication Fumee");
    if (cbSaut && !cbSaut.checked) cbSaut.click();
    if (cbCourse && !cbCourse.checked) cbCourse.click();
  }

  if (sel.chute) {
    let s = "Chute";
    s += sel.chute_15m ? " +15m" : " -15m";
    blessures.push(s);
  }
  if (sel.explosion) blessures.push("Explosion");
  if (sel.brulure) blessures.push("Brulures");
  if (sel.attaque_animal) blessures.push("Attaque Animal");

  if (blessures.length)
    appendToField("Blessures", blessures.join(" + "), " + ");
  if (sel.douleur > 0)
    appendToField("Blessures", `// Douleur: ${sel.douleur}`, " ");
  if (sel.inconscient) appendToField("Blessures", "// Inconscient", " ");

  if (sel.noyade) {
    if (sel.depo) appendToField("Examens", "Echo: Presence Depot Poumon");
    else appendToField("Examens", "Echo: RAS");
  }
  if (sel.intox_fumee) appendToField("Examens", "Echo: Brulure Bronches");
  if (sel.coma_ethylique) {
    const taux = sel.coma_ethylique_g || "[NOMBRE]";
    appendToField("Examens", `Ethylotest : ${taux}mg/L`);
  }
  if (sel.overdose) appendToField("Examens", "Test Salivaire: Positif");

  if (sel.intox_fumee) appendToField("Traitements", "Bouteille d'O2 // AI + AD");
  if (sel.coma_ethylique) appendToField("Traitements", "Lavage d'estomac // Baclofene");
  if (sel.overdose) appendToField("Traitements", "Lavage d'estomac");
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

  const durations = [];
  if (sel.desydratation || sel.hypoglycemie || sel.coma_ethylique || sel.overdose) durations.push("00:30:00");
  if (sel.noyade) durations.push(sel.coma ? "00:45:00" : "00:30:00");
  if (sel.intox_fumee) durations.push(sel.coma ? "00:45:00" : "00:30:00");
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

  if (sel.canne) appendToField("Remarque(s)", "Pret de canne", " + ");
  if (sel.fauteuil) appendToField("Remarque(s)", "Pret de fauteuil", " + ");

  if (sel.vm || sel.cu || sel.detatouage)
    setTimeout(() => setSelectOption("Type", "Note interne"), 50);
}

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
      COMPLETION_CONFIG.find((g) => g.group === item.requiresGroup) &&
      COMPLETION_CONFIG.find((g) => g.group === item.requiresGroup).items
      || [];
    const anyChecked = groupItems.some((gi) => {
      const cb = panel.querySelector(`#med-compl-${gi.key}`);
      return cb && cb.checked && !cb.disabled;
    });
    if (!anyChecked) return true;
  }
  if (item.disabledWhenNonZero) {
    const keys = Array.isArray(item.disabledWhenNonZero)
      ? item.disabledWhenNonZero
      : [item.disabledWhenNonZero];
    if (
      keys.some((key) => {
        const el = panel.querySelector(`#med-compl-${key}`);
        return el && parseInt(el.value, 10) > 0;
      })
    )
      return true;
  }
  return false;
}

function updateAllStates(panel) {
  COMPLETION_ITEMS.forEach((item) => {
    const el = panel.querySelector(`#med-compl-${item.key}`);
    const row = el && el.closest(".med-completion-row");
    if (!el) return;
    const newDisabled = computeDisabled(item, panel);
    if (newDisabled) {
      if (item.type === "slider") {
        el.value = 0;
        updateSliderDisplay(el);
      } else if (item.type === "text") {
        el.value = "";
      } else if (!el.disabled) el.checked = false;
    }
    el.disabled = newDisabled;
    if (row) row.classList.toggle("med-completion-row--disabled", newDisabled);
  });
}

function updateSliderDisplay(sliderEl) {
  const display = sliderEl.parentElement && sliderEl.parentElement.querySelector(
    ".med-completion-slider-value",
  );
  if (display) display.textContent = sliderEl.value;
}

function buildPanel() {
  const panel = document.createElement("div");
  panel.className = "med-completion-panel";

  const scrollArea = document.createElement("div");
  scrollArea.className = "med-completion-scroll";

  for (const { group, items } of COMPLETION_CONFIG) {
    const groupEl = document.createElement("div");
    groupEl.className = "med-completion-group";

    const groupTitle = document.createElement("div");
    groupTitle.className = "med-completion-group-title";
    groupTitle.textContent = group;
    groupEl.appendChild(groupTitle);

    for (const item of items) {
      const row = document.createElement("div");
      row.className = "med-completion-row";
      if (item.level) row.style.paddingLeft = item.level * 16 + "px";

      const startsDisabled =
        !!item.parent || !!item.requiresGroup || !!item.disabledWhenNonZero;

      const lbl = document.createElement("label");
      lbl.className = "med-completion-label";
      lbl.textContent = item.label;
      lbl.htmlFor = `med-compl-${item.key}`;

      if (item.type === "text") {
        const inp = document.createElement("input");
        inp.type = "text";
        inp.id = `med-compl-${item.key}`;
        inp.className = "med-completion-text-input";
        inp.dataset.key = item.key;
        inp.placeholder = item.label;
        inp.disabled = startsDisabled;
        if (startsDisabled) row.classList.add("med-completion-row--disabled");
        inp.addEventListener("input", () => updateAllStates(panel));
        row.appendChild(lbl);
        row.appendChild(inp);
      } else if (item.type === "slider") {
        const slider = document.createElement("input");
        slider.type = "range";
        slider.id = `med-compl-${item.key}`;
        slider.className = "med-completion-slider";
        slider.dataset.key = item.key;
        slider.min = item.min != null ? item.min : 0;
        slider.max = item.max != null ? item.max : 10;
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

      scrollArea.appendChild(groupEl);
    }

    panel.appendChild(scrollArea);

  updateAllStates(panel);
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
  if (container.querySelector(".med-completion-wrapper")) return;

  if (window.getComputedStyle(container).position === "static") {
    container.style.position = "relative";
  }

  const wrapper = document.createElement("div");
  wrapper.className = "med-completion-wrapper";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "med-completion-btn";
  btn.textContent = "Completion";
  wrapper.appendChild(btn);

  let panel = null;
  let escHandler = null;
  let clickOutsideHandler = null;

  function closePanel() {
    if (!panel) return;
    panel.classList.remove("med-completion-panel--open");
    btn.classList.remove("med-completion-btn--open");
    if (escHandler) {
      document.removeEventListener("keydown", escHandler);
      escHandler = null;
    }
    if (clickOutsideHandler) {
      document.removeEventListener("click", clickOutsideHandler);
      clickOutsideHandler = null;
    }
    const dialogRoot = container.closest(".MuiDialog-root");
    if (dialogRoot) dialogRoot.style.zIndex = "";
    setTimeout(() => {
      if (panel && panel.parentNode) {
        panel.remove();
        panel = null;
      }
    }, 200);
  }

  btn.addEventListener("click", () => {
    if (panel && panel.isConnected) {
      closePanel();
      return;
    }

    panel = buildPanel();

    const validateBtn = document.createElement("button");
    validateBtn.type = "button";
    validateBtn.className = "med-completion-validate";
    validateBtn.textContent = "Valider";

    validateBtn.addEventListener("click", async () => {
      const selections = {};
      panel.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
        selections[cb.dataset.key] = cb.checked;
      });
      panel.querySelectorAll('input[type="range"]').forEach((slider) => {
        selections[slider.dataset.key] = parseInt(slider.value, 10);
      });
      panel.querySelectorAll('input[type="text"]').forEach((inp) => {
        selections[inp.dataset.key] = inp.value.trim();
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
    wrapper.appendChild(panel);

    const dialogRoot = container.closest(".MuiDialog-root");
    if (dialogRoot) dialogRoot.style.zIndex = "100001";

    const containerRect = container.getBoundingClientRect();
    panel.style.position = "fixed";
    panel.style.top = containerRect.top + "px";
    panel.style.left = (containerRect.right + 12) + "px";
    panel.style.maxHeight = containerRect.height + "px";

    btn.classList.add("med-completion-btn--open");

    escHandler = (e) => {
      if (e.key === "Escape") closePanel();
    };
    document.addEventListener("keydown", escHandler);

    const openedAt = Date.now();
    clickOutsideHandler = (e) => {
      if (Date.now() - openedAt < 300) return;
      if (panel && !panel.contains(e.target) && e.target !== btn) {
        closePanel();
      }
    };
    document.addEventListener("click", clickOutsideHandler);

    requestAnimationFrame(() => {
      panel.classList.add("med-completion-panel--open");
    });
  });

  container.appendChild(wrapper);

  setTimeout(() => {
    const enregistrerBtn = [...document.querySelectorAll("button")].find(
      (b) => b.textContent.trim().toLowerCase() === "enregistrer",
    );
    if (enregistrerBtn) {
      const containerRect = container.getBoundingClientRect();
      const enregistrerRect = enregistrerBtn.getBoundingClientRect();
      wrapper.style.right = containerRect.right - enregistrerRect.right + "px";
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

const completionObserver = new MutationObserver(() => {
  tryInjectCompletion();
});

completionObserver.observe(document.body, { childList: true, subtree: true });

tryInjectCompletion();
