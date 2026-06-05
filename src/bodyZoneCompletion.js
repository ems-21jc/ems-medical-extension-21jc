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

  // La sidebar est un élément fixe sur le côté droit de l'écran.
  // Elle ne bloque pas le formulaire derrière.
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

  // Colonne zones
  const zonesCol = document.createElement("div");
  zonesCol.className = "bz-zones-col";

  const zonesLabel = document.createElement("div");
  zonesLabel.className = "bz-col-label";
  zonesLabel.textContent = "Zone";
  zonesCol.appendChild(zonesLabel);

  const zoneList = document.createElement("div");
  zoneList.className = "bz-zone-list";
  zonesCol.appendChild(zoneList);

  // Colonne pathologies
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

  // ── Stack — liste des pathologies ajoutées ───────────────────────────────────
  // C'est ici qu'on voit ce qui sera injecté. Chaque entrée peut être supprimée.
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
  // stack = tableau d'objets { zone, patho }
  // Chaque ajout s'y ajoute et est affiché dans stackList.
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
    const groups = new Map(); // patho.key → { patho, entries: [{zone, stackIndex}] }
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

      // Zones en vert, séparées par " + " si fusion
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
        // Cas simple : un seul bouton ✕
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

  // ── Fusion des doublons ───────────────────────────────────────────────────────
  // Regroupe les entrées du stack qui partagent le même patho.key.
  // Pour chaque groupe, remplace le nom de zone dans les textes examens/soins
  // par la liste des zones concernées, séparées par " + ".
  //
  // Exemple : Fracture Nette sur Bras Gauche + Pied Droit
  //   examens : "Radio : Fracture nette Bras Gauche + Pied Droit"
  //   soins   : "Attelle rigide Bras Gauche + Pied Droit // AD + AI"
  function mergeStack(stack) {
    // 1. Regroupe par patho.key en conservant l'ordre de première apparition
    const groups = [];
    const seen = new Map(); // patho.key → index dans groups

    for (const entry of stack) {
      if (seen.has(entry.patho.key)) {
        groups[seen.get(entry.patho.key)].zones.push(entry.zone);
      } else {
        seen.set(entry.patho.key, groups.length);
        groups.push({ patho: entry.patho, zones: [entry.zone] });
      }
    }

    // 2. Pour chaque groupe, reconstruit les textes en fusionnant les zones
    return groups.map(({ patho, zones }) => {
      if (zones.length === 1) {
        // Pas de doublon : on renvoie les textes tels quels
        return { examens: patho.examens, soins: patho.soins };
      }

      // Plusieurs zones : on cherche le label de la première zone dans les textes
      // et on remplace par "Zone1 + Zone2 + ..."
      const firstZoneLabel = zones[0].label;
      const mergedZoneLabel = zones.map((z) => z.label).join(" + ");

      const examens = patho.examens.replaceAll(firstZoneLabel, mergedZoneLabel);
      const soins   = patho.soins.replaceAll(firstZoneLabel, mergedZoneLabel);

      return { examens, soins };
    });
  }

  // Injecte toutes les pathologies du stack dans le formulaire
  function injectAll() {
    if (stack.length === 0) return;

    const merged = mergeStack(stack);

    const examensText = merged.map((e) => e.examens).join(" // ");
    const soinsText   = merged.map((e) => e.soins).join(" // ");

    bz_appendToField("Examens", examensText);
    bz_prependToField("Traitements", soinsText);

    closeSidebar();
  }

  // Quand on clique une pathologie → on propose le bouton "Ajouter au bilan"
  function selectPatho(zone, patho, pBtn) {
    // Retire le highlight des autres boutons de pathologie
    pathoList.querySelectorAll(".bz-patho-btn").forEach((b) => {
      b.classList.remove("bz-patho-btn--active");
      // Remet le texte original si ce bouton avait été transformé en "Ajouter"
      const orig = b.dataset.origLabel;
      if (orig) b.textContent = orig;
    });

    pBtn.classList.add("bz-patho-btn--active");

    // Vérifie si cette pathologie est déjà dans le stack
    const alreadyIn = stack.some(
      (e) => e.zone.key === zone.key && e.patho.key === patho.key
    );

    if (alreadyIn) {
      pBtn.textContent = "✓ Déjà ajoutée";
    } else {
      pBtn.dataset.origLabel = patho.label;
      pBtn.textContent = `+ Ajouter — ${patho.label}`;
      // Un second clic sur le bouton actif = on l'ajoute au stack
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

  // Quand on clique une zone → recharge les pathologies
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

      // Indique visuellement si déjà dans le stack
      const alreadyIn = stack.some(
        (e) => e.zone.key === zone.key && e.patho.key === patho.key
      );
      pBtn.textContent = alreadyIn ? `✓ ${patho.label}` : patho.label;
      if (alreadyIn) pBtn.classList.add("bz-patho-btn--in-stack");

      pBtn.addEventListener("click", () => {
        if (alreadyIn) return; // déjà dans le stack, clic ignoré
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

  // Init du stack vide
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
  // Ne pas ouvrir deux fois
  if (document.getElementById("bz-sidebar")) return;
  const sidebar = buildSidebar();
  document.body.appendChild(sidebar);
  // Lance l'animation d'entrée (slide-in depuis la gauche)
  requestAnimationFrame(() => sidebar.classList.add("bz-sidebar--open"));
}

function closeSidebar() {
  const sidebar = document.getElementById("bz-sidebar");
  if (!sidebar) return;
  sidebar.classList.remove("bz-sidebar--open");
  // Attend la fin de la transition CSS avant de retirer l'élément du DOM
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
      const containerRect = container.getBoundingClientRect();
      const enregistrerRect = enregistrerBtn.getBoundingClientRect();
      const rightOffset = containerRect.right - enregistrerRect.right;
      btn.style.right = rightOffset + "px";
      const completionBtn = container.querySelector(".med-completion-btn");
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