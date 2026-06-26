// ══════════════════════════════════════════════════════════════════════════════
// bodyZoneCompletion.js
// Sidebar anatomique - lit pathologies.json (structure v2 avec soins typés),
// permet de stacker plusieurs pathologies et injecte tout en une fois.
//
// Structure d'une pathologie dans le JSON :
//   examens : [{ appareil, contenu }]
//   soins   : [{ type, contenu, prefixe? }]
//     type "chir" → regroupé par préfixe, ex: "Chir AL ou AG : X + Y"
//     type "immo" → tout joint sur une ligne  : "Attelle Bras Droit + Bandage Torse + Repos"
//     type "meds" → sigles dédupliqués        : "Glace + AD + AI + AB + AC"
// ══════════════════════════════════════════════════════════════════════════════

import BODY_ZONES from "./pathologies.json";

// ── Utilitaires d'injection dans le formulaire ────────────────────────────────

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

  // ── Header ───────────────────────────────────────────────────────────────────
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

  // ── Sélecteur zones + pathologies ────────────────────────────────────────────
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

  // ── Stack ─────────────────────────────────────────────────────────────────────
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
  clearAllBtn.addEventListener("click", () => { stack = []; renderStack(); });
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

  // ── État ──────────────────────────────────────────────────────────────────────
  let stack = []; // [{ zone, patho }]

  // ── renderStack ───────────────────────────────────────────────────────────────
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

  // ── buildResult ───────────────────────────────────────────────────────────────
  // Construit les textes finaux à partir du stack.
  //
  // EXAMENS
  //   Tous les { appareil, contenu } regroupés par appareil (insensible à la casse).
  //   Contenus identiques dédupliqués.
  //   → "Radio : X + Y + Z // Echo : A + B"
  //
  // SOINS - ordre fixe : chir → immo → meds
  //   chir : regroupés par préfixe exact, contenus dédupliqués par préfixe
  //          → "Chir AL ou AG : Retrait balles + cautérisation + PDS muscle + PDS cutané"
  //   immo : tous les contenus dédupliqués, joints sur une seule ligne par " + "
  //          → "Attelle rigide Bras Droit + Bandage & attelle rigide Torse + Repos"
  //   meds : split sur " + ", dédupliqués, réordonnés (produits spéciaux d'abord, sigles à la fin)
  //          → "Glace + Poche réhydratante + AD + AI + AB + AC"
  function buildResult(stack) {

    // ── Examens ────────────────────────────────────────────────────────────────
    const examGroups = new Map(); // APPAREIL → { label, Set<contenu> }
    const examOrder  = [];

    for (const { patho } of stack) {
      for (const seg of patho.examens) {
        const key = seg.appareil.toUpperCase();
        if (!examGroups.has(key)) {
          examGroups.set(key, { label: seg.appareil, contents: new Set() });
          examOrder.push(key);
        }
        examGroups.get(key).contents.add(seg.contenu);
      }
    }

    const examensText = examOrder
      .map((k) => {
        const { label, contents } = examGroups.get(k);
        return `${label} : ${[...contents].join(" + ")}`;
      })
      .join(" // ");

    // ── Soins ──────────────────────────────────────────────────────────────────

    // Chir : regroupés par préfixe, contenus dédupliqués par préfixe
    const chirGroups = new Map(); // prefixe → Set<contenu>
    const chirOrder  = [];

    // Immo : contenus dédupliqués, ordre de première apparition
    const immoContents = [];
    const immoSeen     = new Set();

    // Meds : chaque sigle/produit collecté individuellement, dédupliqué
    const medsSet = new Set();

    // Ordre d'affichage des meds courants - les sigles médicaux passent en dernier
    const MEDS_SIGLES = ["AD", "AI", "AB", "AC", "AF"];

    for (const { patho } of stack) {
      for (const soin of patho.soins) {

        if (soin.type === "chir") {
          const key = soin.prefixe || "Chir";
          if (!chirGroups.has(key)) {
            chirGroups.set(key, new Set());
            chirOrder.push(key);
          }
          chirGroups.get(key).add(soin.contenu);
        }

        else if (soin.type === "immo") {
          if (!immoSeen.has(soin.contenu)) {
            immoSeen.add(soin.contenu);
            immoContents.push(soin.contenu);
          }
        }

        else if (soin.type === "meds") {
          soin.contenu.split(/\s*\+\s*/).forEach((m) => medsSet.add(m.trim()));
        }
      }
    }

    // Ligne(s) Chir
    const chirLines = chirOrder.map(
      (key) => `${key} : ${[...chirGroups.get(key)].join(" + ")}`
    );

    // Ligne Immo (tout sur une ligne)
    const immoLine = immoContents.length > 0
      ? immoContents.join(" + ")
      : null;

    // Ligne Meds : produits spéciaux d'abord, sigles médicaux en dernier
    const medsArr     = [...medsSet];
    const medsSpecial = medsArr.filter((m) => !MEDS_SIGLES.includes(m));
    const medsSigles  = MEDS_SIGLES.filter((m) => medsArr.includes(m));
    const medsLine    = [...medsSpecial, ...medsSigles].join(" + ") || null;

    // Assemblage final
    const soinsText = [
      ...chirLines,
      immoLine,
      medsLine,
    ].filter(Boolean).join(" // ");

    return { examensText, soinsText };
  }

  // ── injectAll ─────────────────────────────────────────────────────────────────
  function injectAll() {
    if (stack.length === 0) return;
    const { examensText, soinsText } = buildResult(stack);
    bz_appendToField("Examens", examensText);
    bz_prependToField("Traitements", soinsText);
    closeSidebar();
  }

  // ── Sélection d'une pathologie ────────────────────────────────────────────────
  function selectPatho(zone, patho, pBtn) {
    // Réinitialise tous les boutons de la liste
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
      pBtn.textContent = `+ Ajouter - ${patho.label}`;
      // Un second clic = ajout au stack
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

  // Construction des boutons de zones à partir du JSON
  for (const zone of BODY_ZONES) {
    const zBtn = document.createElement("button");
    zBtn.type = "button";
    zBtn.className = "bz-zone-btn";
    zBtn.textContent = zone.label;
    zBtn.addEventListener("click", () => selectZone(zone, zBtn));
    zoneList.appendChild(zBtn);
  }

  renderStack();

  // ── Assemblage final de la sidebar ────────────────────────────────────────────
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

  const escHandler = (e) => {
    if (e.key === "Escape") {
      closeSidebar();
      document.removeEventListener("keydown", escHandler);
    }
  };
  document.addEventListener("keydown", escHandler);
  sidebar._escHandler = escHandler;
}

function closeSidebar() {
  const sidebar = document.getElementById("bz-sidebar");
  if (!sidebar) return;
  if (sidebar._escHandler) {
    document.removeEventListener("keydown", sidebar._escHandler);
  }
  sidebar.classList.remove("bz-sidebar--open");
  sidebar.addEventListener("transitionend", () => sidebar.remove(), { once: true });
}

// ── Bouton déclencheur dans le formulaire ─────────────────────────────────────

function injectBodyZoneButton(titleEl) {
  const container = findModalContainer(titleEl);
  if (container.querySelector(".bz-trigger-btn")) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "bz-trigger-btn";
  btn.textContent = "Bilan";

  // Toggle : ouvre ou ferme la sidebar
  btn.addEventListener("click", () => {
    if (document.getElementById("bz-sidebar")) closeSidebar();
    else openSidebar();
  });
  container.appendChild(btn);

  // Positionnement dynamique à gauche du bouton Enregistrer / Complétion
  setTimeout(() => {
    const enregistrerBtn = [...document.querySelectorAll("button")].find(
      (b) => b.textContent.trim().toLowerCase() === "enregistrer"
    );
    if (enregistrerBtn) {
      const containerRect   = container.getBoundingClientRect();
      const enregistrerRect = enregistrerBtn.getBoundingClientRect();
      const rightOffset     = containerRect.right - enregistrerRect.right;
      btn.style.right       = rightOffset + "px";
      const completionWrapper = container.querySelector(".med-completion-wrapper");
      if (completionWrapper) {
        completionWrapper.style.right = (rightOffset + btn.offsetWidth + 8) + "px";
      }
    }
  }, 50);
}

// ── Détection du formulaire via MutationObserver ──────────────────────────────

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
  // Ferme la sidebar si le formulaire disparaît (navigation SPA)
  if (document.getElementById("bz-sidebar")) {
    const formOpen = [...document.querySelectorAll(
      'h1, h2, h3, h4, h5, [class*="title"], [class*="Title"]'
    )].some((el) => el.textContent.trim().includes("Nouveau rapport medical"));
    if (!formOpen) closeSidebar();
  }
});

bodyZoneObserver.observe(document.body, { childList: true, subtree: true });
tryInjectBodyZone();