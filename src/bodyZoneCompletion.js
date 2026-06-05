// ══════════════════════════════════════════════════════════════════════════════
// bodyZoneCompletion.js
// Sidebar anatomique — lit pathologies.json, permet de stacker plusieurs
// pathologies et injecte tout en une fois dans le formulaire.
// ══════════════════════════════════════════════════════════════════════════════

import BODY_ZONES from "./pathologies.json";

// ── Utilitaires d'injection ───────────────────────────────────────────────────

function bz_findFieldByLabel(labelText) {
  for (const el of document.querySelectorAll('label, .label, [class*="label"]')) {
    if (el.textContent.trim().includes(labelText)) {
      if (el.htmlFor) {
        const field = document.getElementById(el.htmlFor);
        if (field) return field;
      }
      const parent = el.closest("div, fieldset");
      if (parent) {
        const field = parent.querySelector('textarea, input:not([type="checkbox"])');
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

function bz_appendToField(labelText, text, separator = " // ") {
  const field = bz_findFieldByLabel(labelText);
  if (!field) return;
  field.focus();
  field.setSelectionRange(field.value.length, field.value.length);
  const prefix = field.value.trim() ? separator : "";
  document.execCommand("insertText", false, prefix + text);
}

function bz_prependToField(labelText, text, separator = " // ") {
  const field = bz_findFieldByLabel(labelText);
  if (!field) return;
  field.focus();
  field.setSelectionRange(0, 0);
  document.execCommand("insertText", false, text + (field.value.trim() ? separator : ""));
}

// ── Construction de la sidebar ────────────────────────────────────────────────
function buildSidebar() {

  const sidebar = document.createElement("div");
  sidebar.className = "bz-sidebar";
  sidebar.id = "bz-sidebar";

  // ── Header ──────────────────────────────────────────────────────────────────
  const header = document.createElement("div");
  header.className = "bz-header";

  const title = document.createElement("span");
  title.className = "bz-title";
  title.textContent = "🩺 Bilan Anatomique";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "bz-close-btn";
  closeBtn.textContent = "✕";
  closeBtn.addEventListener("click", closeSidebar);

  header.appendChild(title);
  header.appendChild(closeBtn);

  // ── Sélecteur : zones + pathologies ─────────────────────────────────────────
  const selector = document.createElement("div");
  selector.className = "bz-selector";

  const zonesCol = document.createElement("div");
  zonesCol.className = "bz-zones-col";

  const zonesLabel = document.createElement("div");
  zonesLabel.className = "bz-col-label";
  zonesLabel.textContent = "Zone";
  zonesCol.appendChild(zonesLabel);

  const zoneList = document.createElement("div");
  zoneList.className = "bz-zone-list";
  zonesCol.appendChild(zoneList);

  const pathoCol = document.createElement("div");
  pathoCol.className = "bz-patho-col";

  const pathoLabel = document.createElement("div");
  pathoLabel.className = "bz-col-label";
  pathoLabel.textContent = "Pathologie";
  pathoCol.appendChild(pathoLabel);

  const pathoList = document.createElement("div");
  pathoList.className = "bz-patho-list";

  const pathoEmpty = document.createElement("div");
  pathoEmpty.className = "bz-empty-msg";
  pathoEmpty.textContent = "← Sélectionnez une zone";
  pathoList.appendChild(pathoEmpty);
  pathoCol.appendChild(pathoList);

  selector.appendChild(zonesCol);
  selector.appendChild(pathoCol);

  // ── Stack ────────────────────────────────────────────────────────────────────
  const stackSection = document.createElement("div");
  stackSection.className = "bz-stack-section";

  const stackHeader = document.createElement("div");
  stackHeader.className = "bz-stack-header";

  const stackLabel = document.createElement("span");
  stackLabel.className = "bz-col-label";
  stackLabel.textContent = "Sélection";

  const clearAllBtn = document.createElement("button");
  clearAllBtn.type = "button";
  clearAllBtn.className = "bz-clear-all-btn";
  clearAllBtn.textContent = "Tout effacer";
  clearAllBtn.addEventListener("click", () => {
    stack = [];
    renderStack();
  });

  stackHeader.appendChild(stackLabel);
  stackHeader.appendChild(clearAllBtn);

  const stackList = document.createElement("div");
  stackList.className = "bz-stack-list";

  stackSection.appendChild(stackHeader);
  stackSection.appendChild(stackList);

  // ── Boutons d'action ──────────────────────────────────────────────────────────
  const actions = document.createElement("div");
  actions.className = "bz-actions";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "bz-btn bz-btn--cancel";
  cancelBtn.textContent = "Fermer";
  cancelBtn.addEventListener("click", closeSidebar);

  const injectBtn = document.createElement("button");
  injectBtn.type = "button";
  injectBtn.className = "bz-btn bz-btn--inject";
  injectBtn.textContent = "✚ Injecter tout";
  injectBtn.addEventListener("click", injectAll);

  actions.appendChild(cancelBtn);
  actions.appendChild(injectBtn);

  // ── État ─────────────────────────────────────────────────────────────────────
  let stack = [];

  function renderStack() {
    stackList.innerHTML = "";
    if (stack.length === 0) {
      const empty = document.createElement("div");
      empty.className = "bz-empty-msg";
      empty.textContent = "Aucune pathologie ajoutée";
      stackList.appendChild(empty);
      injectBtn.disabled = true;
      injectBtn.textContent = "✚ Injecter tout";
      return;
    }

    injectBtn.disabled = false;
    injectBtn.textContent = `✚ Injecter (${stack.length})`;

    // Regroupe par patho.key pour afficher les fusions en temps réel
    const groups = new Map();
    stack.forEach((entry, index) => {
      if (!groups.has(entry.patho.key)) {
        groups.set(entry.patho.key, { patho: entry.patho, entries: [] });
      }
      groups.get(entry.patho.key).entries.push({ zone: entry.zone, index });
    });

    for (const { patho, entries } of groups.values()) {
      const item = document.createElement("div");
      item.className = entries.length > 1
        ? "bz-stack-item bz-stack-item--merged"
        : "bz-stack-item";

      const info = document.createElement("div");
      info.className = "bz-stack-item-info";

      const zoneName = document.createElement("span");
      zoneName.className = "bz-stack-item-zone";
      zoneName.textContent = entries.map((e) => e.zone.label).join(" + ");

      const pathoName = document.createElement("span");
      pathoName.className = "bz-stack-item-patho";
      pathoName.textContent = patho.label;

      info.appendChild(zoneName);
      info.appendChild(pathoName);

      const removeBtns = document.createElement("div");
      removeBtns.className = "bz-stack-remove-group";

      if (entries.length === 1) {
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "bz-stack-remove-btn";
        removeBtn.textContent = "✕";
        removeBtn.title = `Retirer ${entries[0].zone.label}`;
        removeBtn.addEventListener("click", () => {
          stack.splice(entries[0].index, 1);
          renderStack();
        });
        removeBtns.appendChild(removeBtn);
      } else {
        // Fusion : un ✕ par zone pour retirer individuellement
        for (const entry of entries) {
          const wrap = document.createElement("div");
          wrap.className = "bz-stack-remove-wrap";

          const zoneTag = document.createElement("span");
          zoneTag.className = "bz-stack-remove-zone-tag";
          zoneTag.textContent = entry.zone.label;

          const removeBtn = document.createElement("button");
          removeBtn.type = "button";
          removeBtn.className = "bz-stack-remove-btn bz-stack-remove-btn--small";
          removeBtn.textContent = "✕";
          removeBtn.title = `Retirer ${entry.zone.label}`;
          removeBtn.addEventListener("click", () => {
            const currentIndex = stack.findIndex(
              (e) => e.zone.key === entry.zone.key && e.patho.key === patho.key
            );
            if (currentIndex !== -1) stack.splice(currentIndex, 1);
            renderStack();
          });

          wrap.appendChild(zoneTag);
          wrap.appendChild(removeBtn);
          removeBtns.appendChild(wrap);
        }
      }

      item.appendChild(info);
      item.appendChild(removeBtns);
      stackList.appendChild(item);
    }
  }

  // ── Constantes pour le nettoyage des soins ────────────────────────────────────
  // Médicaments reconnus (sigles exacts, insensible à la casse)
  const MEDS = ["AD", "AI", "AB", "AC", "AF"];
  // Bobologie : expressions à repérer dans les soins
  const BOBOLOGIE = ["Glace", "Pommade", "crème cicatrisante", "crème anesthésiante"];
  // Appareils d'examen reconnus pour la fusion des examens
  const APPAREILS = ["Radio", "Auscultation", "Echo", "IRM", "Constantes", "Ethylomètre", "Test salivaire", "Psy"];

  // ── extractTerm ───────────────────────────────────────────────────────────────
  // Retire d'un texte toutes les occurrences d'un terme et son séparateur " // " adjacent.
  // Renvoie { cleaned, found }.
  function extractTerm(text, term) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(
      `(?:\\s*//\\s*${escaped}(?:\\s*\\([^)]*\\))?|${escaped}(?:\\s*\\([^)]*\\))?\\s*//\\s*|\\b${escaped}(?:\\s*\\([^)]*\\))?\\b)`,
      "gi"
    );
    let found = false;
    const cleaned = text.replace(re, (match) => { found = true; return ""; })
      .replace(/\s*\/\/\s*\/\//g, " //")  // double séparateur résiduel
      .replace(/^\s*\/\/\s*/g, "")         // séparateur en début
      .replace(/\s*\/\/\s*$/g, "")         // séparateur en fin
      .replace(/\s*\+\s*\/\//g, " //")     // "Zone + //" → "Zone //"
      .replace(/\s*\/\/\s*\+\s*/g, " //")  // "// + Suite" → "// Suite"
      .replace(/\s*\+\s*$/g, "")           // "Zone +" en fin de chaîne
      .trim();
    return { cleaned, found };
  }

  // ── mergeExamens ──────────────────────────────────────────────────────────────
  // Reçoit un tableau de textes d'examens bruts (un par entrée du stack).
  // Découpe chaque texte en segments " // ", regroupe par préfixe d'appareil,
  // et fusionne les contenus avec " + ".
  //
  // Exemple :
  //   ["Radio : Fracture nette Bras Gauche", "Radio : Fracture nette Bras Droit",
  //    "Radio : Fracture nette côte(s) torse", "Echo : Déchirure torse"]
  //   → "Radio : Fracture nette Bras Gauche + Fracture nette Bras Droit + Fracture nette côte(s) torse // Echo : Déchirure torse"
  //
  // Les segments sans préfixe reconnu sont conservés à la fin tels quels.
  function mergeExamens(examensArray) {
    const groups  = new Map(); // clé MAJUSCULES → { label: string, contents: string[] }
    const order   = [];
    const orphans = [];

    for (const examens of examensArray) {
      const segments = examens.split(/\s*\/\/\s*/);
      for (const seg of segments) {
        if (!seg.trim()) continue;
        const match = seg.match(new RegExp(`^(${APPAREILS.join("|")})\\s*:\\s*(.+)$`, "i"));
        if (match) {
          const key     = match[1].toUpperCase();
          const label   = match[1]; // casse du premier segment rencontré
          const content = match[2].trim();
          if (!groups.has(key)) {
            groups.set(key, { label, contents: [] });
            order.push(key);
          }
          groups.get(key).contents.push(content);
        } else {
          orphans.push(seg.trim());
        }
      }
    }

    const merged = order.map((key) => {
      const { label, contents } = groups.get(key);
      return `${label} : ${contents.join(" + ")}`;
    });
    return [...merged, ...orphans].join(" // ");
  }

  // ── mergeStack ────────────────────────────────────────────────────────────────
  // Ordre des étapes :
  //   1. mergeExamens sur les textes bruts du JSON → un seul texte d'examens fusionné
  //   2. Fusion des soins par patho.key + remplacement des noms de zone
  //   3. Nettoyage global des soins : médicaments, bobologie et Repos extraits
  //      vers un suffixe commun dédupliqué
  function mergeStack(stack) {

    // Étape 1 — examens : fusion par appareil sur les textes originaux du JSON
    const examensText = mergeExamens(stack.map((e) => e.patho.examens));

    // Étape 2 — soins : regroupement par patho.key + fusion des zones
    const groups = [];
    const seen   = new Map();

    for (const entry of stack) {
      if (seen.has(entry.patho.key)) {
        groups[seen.get(entry.patho.key)].zones.push(entry.zone);
      } else {
        seen.set(entry.patho.key, groups.length);
        groups.push({ patho: entry.patho, zones: [entry.zone] });
      }
    }

    const mergedSoins = groups.map(({ patho, zones }) => {
      if (zones.length === 1) return patho.soins;
      const firstZoneLabel  = zones[0].label;
      const mergedZoneLabel = zones.map((z) => z.label).join(" + ");
      return patho.soins.replaceAll(firstZoneLabel, mergedZoneLabel);
    });

    // Étape 3 — nettoyage des soins : collecte et déduplique meds, bobo, Repos
    const collectedMeds = new Set();
    const collectedBobo = new Set();
    let   hasRepos      = false;

    const cleanedSoins = mergedSoins.map((soins) => {
      let s = soins;
      for (const m of MEDS) {
        const { cleaned, found } = extractTerm(s, m);
        if (found) { collectedMeds.add(m); s = cleaned; }
      }
      for (const b of BOBOLOGIE) {
        const { cleaned, found } = extractTerm(s, b);
        if (found) { collectedBobo.add(b); s = cleaned; }
      }
      const { cleaned: r, found: fr } = extractTerm(s, "Repos");
      if (fr) { hasRepos = true; s = r; }
      return s;
    });

    // Suffixe commun : bobologie // médicaments // Repos
    const suffix = [
      ...[...collectedBobo],
      collectedMeds.size > 0 ? [...collectedMeds].join(" + ") : null,
      hasRepos ? "Repos" : null,
    ].filter(Boolean).join(" // ");

    return { examensText, cleanedSoins, suffix };
  }

  // ── injectAll ─────────────────────────────────────────────────────────────────
  function injectAll() {
    if (stack.length === 0) return;

    const { examensText, cleanedSoins, suffix } = mergeStack(stack);

    const soinsBody = cleanedSoins.filter(Boolean).join(" // ");
    const soinsText = [soinsBody, suffix].filter(Boolean).join(" // ");

    bz_appendToField("Examens", examensText);
    bz_prependToField("Traitements", soinsText);

    closeSidebar();
  }

  // ── Sélection d'une pathologie ────────────────────────────────────────────────
  function selectPatho(zone, patho, pBtn) {
    pathoList.querySelectorAll(".bz-patho-btn").forEach((b) => {
      b.classList.remove("bz-patho-btn--active");
      const orig = b.dataset.origLabel;
      if (orig) b.textContent = orig;
    });

    pBtn.classList.add("bz-patho-btn--active");

    const alreadyIn = stack.some(
      (e) => e.zone.key === zone.key && e.patho.key === patho.key
    );

    if (alreadyIn) {
      pBtn.textContent = "✓ Déjà ajoutée";
    } else {
      pBtn.dataset.origLabel = patho.label;
      pBtn.textContent = `+ Ajouter — ${patho.label}`;
      pBtn.addEventListener("click", function addToStack() {
        if (stack.some((e) => e.zone.key === zone.key && e.patho.key === patho.key)) return;
        stack.push({ zone, patho });
        renderStack();
        pBtn.textContent = "✓ Ajoutée !";
        pBtn.removeEventListener("click", addToStack);
        setTimeout(() => {
          if (pBtn.classList.contains("bz-patho-btn--active")) {
            pBtn.textContent = "✓ Déjà ajoutée";
          }
        }, 1200);
      }, { once: true });
    }
  }

  // ── Sélection d'une zone ──────────────────────────────────────────────────────
  function selectZone(zone, zBtn) {
    zoneList.querySelectorAll(".bz-zone-btn").forEach((b) =>
      b.classList.remove("bz-zone-btn--active")
    );
    zBtn.classList.add("bz-zone-btn--active");

    pathoList.innerHTML = "";
    for (const patho of zone.pathologies) {
      const pBtn = document.createElement("button");
      pBtn.type = "button";
      pBtn.className = "bz-patho-btn";
      pBtn.dataset.origLabel = patho.label;

      const alreadyIn = stack.some(
        (e) => e.zone.key === zone.key && e.patho.key === patho.key
      );
      pBtn.textContent = alreadyIn ? `✓ ${patho.label}` : patho.label;
      if (alreadyIn) pBtn.classList.add("bz-patho-btn--in-stack");

      pBtn.addEventListener("click", () => {
        if (alreadyIn) return;
        selectPatho(zone, patho, pBtn);
      });

      pathoList.appendChild(pBtn);
    }
  }

  // Construction des boutons de zones
  for (const zone of BODY_ZONES) {
    const zBtn = document.createElement("button");
    zBtn.type = "button";
    zBtn.className = "bz-zone-btn";
    zBtn.textContent = zone.label;
    zBtn.addEventListener("click", () => selectZone(zone, zBtn));
    zoneList.appendChild(zBtn);
  }

  renderStack();

  // ── Assemblage ────────────────────────────────────────────────────────────────
  sidebar.appendChild(header);
  sidebar.appendChild(selector);
  sidebar.appendChild(stackSection);
  sidebar.appendChild(actions);

  return sidebar;
}

// ── Ouverture / fermeture de la sidebar ───────────────────────────────────────

function openSidebar() {
  if (document.getElementById("bz-sidebar")) return;
  const sidebar = buildSidebar();
  document.body.appendChild(sidebar);
  requestAnimationFrame(() => sidebar.classList.add("bz-sidebar--open"));
}

function closeSidebar() {
  const sidebar = document.getElementById("bz-sidebar");
  if (!sidebar) return;
  sidebar.classList.remove("bz-sidebar--open");
  sidebar.addEventListener("transitionend", () => sidebar.remove(), { once: true });
}

// ── Injection du bouton déclencheur dans le formulaire ────────────────────────

function injectBodyZoneButton(titleEl) {
  const container = findModalContainer(titleEl);
  if (container.querySelector(".bz-trigger-btn")) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "bz-trigger-btn";
  btn.textContent = "Bilan";

  btn.addEventListener("click", () => {
    if (document.getElementById("bz-sidebar")) closeSidebar();
    else openSidebar();
  });
  container.appendChild(btn);

  setTimeout(() => {
    const enregistrerBtn = [...document.querySelectorAll("button")].find(
      (b) => b.textContent.trim().toLowerCase() === "enregistrer"
    );
    if (enregistrerBtn) {
      const containerRect   = container.getBoundingClientRect();
      const enregistrerRect = enregistrerBtn.getBoundingClientRect();
      const rightOffset     = containerRect.right - enregistrerRect.right;
      btn.style.right       = rightOffset + "px";
      const completionBtn   = container.querySelector(".med-completion-btn");
      if (completionBtn) {
        completionBtn.style.right = (rightOffset + btn.offsetWidth + 8) + "px";
      }
    }
  }, 50);
}

// ── Détection du formulaire ───────────────────────────────────────────────────

function tryInjectBodyZone() {
  for (const el of document.querySelectorAll(
    'h1, h2, h3, h4, h5, [class*="title"], [class*="Title"]'
  )) {
    if (el.textContent.trim().includes("Nouveau rapport medical")) {
      injectBodyZoneButton(el);
      break;
    }
  }
}

const bodyZoneObserver = new MutationObserver(() => {
  tryInjectBodyZone();
  if (document.getElementById("bz-sidebar")) {
    const formOpen = [...document.querySelectorAll(
      'h1, h2, h3, h4, h5, [class*="title"], [class*="Title"]'
    )].some(el => el.textContent.trim().includes("Nouveau rapport medical"));
    if (!formOpen) closeSidebar();
  }
});

bodyZoneObserver.observe(document.body, { childList: true, subtree: true });
tryInjectBodyZone();