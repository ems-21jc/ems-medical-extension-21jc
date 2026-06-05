const mcc_storage = (typeof browser !== "undefined" ? browser : chrome).storage.local;

// ══════════════════════════════════════════════════════════════════════════════
// medicalCheckupCompletion.js
// Bouton VC sur la vue détail d'un rapport médical :
//  - Grisé si la date de visite de contrôle n'est pas encore passée (heure locale)
//  - Au clic : ferme le dialog, ouvre "Nouveau rapport medical", injecte les champs
// ══════════════════════════════════════════════════════════════════════════════

// ── Détection du dialog de détail ────────────────────────────────────────────

function mcc_findDetailDialog() {
  for (const dialog of document.querySelectorAll('[role="dialog"]')) {
    const hasDateCreation = [...dialog.querySelectorAll("p")].some(
      (p) => p.textContent.trim() === "Date de création"
    );
    const isEditForm = [
      ...dialog.querySelectorAll('h1, h2, h3, h4, h5, [class*="title"], [class*="Title"]'),
    ].some((h) => h.textContent.includes("Nouveau rapport medical"));
    if (hasDateCreation && !isEditForm) return dialog;
  }
  return null;
}

// ── Lecture des champs de la vue détail ──────────────────────────────────────

function mcc_getFieldValue(dialog, labelText) {
  for (const p of dialog.querySelectorAll("p")) {
    if (p.textContent.trim() === labelText) {
      const sibling = p.nextElementSibling;
      if (sibling && sibling.tagName === "P") return sibling.textContent.trim();
    }
  }
  return null;
}

// ── Vérifie que la durée d'invalidité est renseignée et non nulle ─────────────

function mcc_hasValidDuration(dialog) {
  const duration = mcc_getFieldValue(dialog, "Durée d'invalidité");
  if (!duration || duration.trim() === "") return false;
  return duration !== "00:00:00";
}

// ── Vérifie si la date de visite de contrôle est passée (heure locale) ───────

function mcc_isControlDatePassed(dateStr) {
  if (!dateStr || /invalid/i.test(dateStr) || dateStr.trim() === "") return false;
  const m = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
  if (!m) return false;
  const [, dd, mm, yyyy, hh, min] = m;
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const controlStr = `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  const nowStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return nowStr >= controlStr;
}

// ── Construit la chaîne Traitements "Retrait X" à partir de l'existant ───────

function mcc_buildTraitementsRetrait(traitementsText) {
  const items = [];
  if (/corset/i.test(traitementsText))
    items.push("Corset");
  if (/bandage/i.test(traitementsText))
    items.push("Bandage");
  if (/ceinture/i.test(traitementsText))
    items.push("Ceinture");
  const hasAttelleS = /attelle\s*souple/i.test(traitementsText);
  const hasAttelleR = /attelle\s*rigide/i.test(traitementsText);
  if (hasAttelleS) items.push("Attelle Souple");
  if (hasAttelleR) items.push("Attelle Rigide");
  if (!hasAttelleS && !hasAttelleR && /attelle/i.test(traitementsText))
    items.push("Attelle");
  if (/minerve|collier cervicale?s?/i.test(traitementsText))
    items.push("Minerve");
  if (/pl[aâ]tre/i.test(traitementsText))
    items.push("Plâtre");
  if (/[eé]paul/i.test(traitementsText))
    items.push("Épaulière");
  if (/[eé]charpe/i.test(traitementsText))
    items.push("Écharpe");
  if (/casque/i.test(traitementsText))
    items.push("Casque");
  return items.length ? "Retrait " + items.join(" + ") : "";
}

// ── Construit la chaîne Examens à partir de l'existant ───────────────────────

function mcc_buildExamensRAS(examensText) {
  const results = [];
  if (/radio/i.test(examensText)) results.push("Radio: RAS");
  if (/scanner|echo|irm/i.test(examensText)) results.push("Echo: RAS");
  if (/auscultation|ausc|auscult/i.test(examensText)) results.push("Auscultation: RAS");
  if (/constantes?\s*:?\s*faibles?/i.test(examensText)) results.push("Constantes: Normales");
  return results.join(" // ");
}

// ── Sélectionne une option dans un Select MUI ────────────────────────────────

function mcc_setSelectOption(labelText, optionText) {
  for (const label of document.querySelectorAll("label")) {
    const text = (label.firstChild?.textContent || label.textContent).trim();
    if (text === labelText || text.startsWith(labelText)) {
      const parent = label.parentElement;
      if (!parent) continue;
      const combobox = parent.querySelector('[role="combobox"]');
      if (combobox) {
        combobox.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
        setTimeout(() => {
          for (const opt of document.querySelectorAll('[role="option"]')) {
            if (opt.textContent.trim() === optionText) { opt.click(); return; }
          }
        }, 100);
        return;
      }
    }
  }
}

// ── Injection dans un champ du formulaire (React-compatible) ─────────────────

function mcc_setField(labelText, value) {
  let field = null;
  for (const el of document.querySelectorAll('label, .label, [class*="label"]')) {
    if (el.textContent.trim().includes(labelText)) {
      if (el.htmlFor) {
        const f = document.getElementById(el.htmlFor);
        if (f) { field = f; break; }
      }
      const parent = el.closest("div, fieldset");
      if (parent) {
        const f = parent.querySelector('textarea, input:not([type="checkbox"])');
        if (f) { field = f; break; }
      }
    }
  }
  if (!field) {
    for (const f of document.querySelectorAll("textarea, input")) {
      const p = f.placeholder || "";
      const a = f.getAttribute("aria-label") || "";
      if (p.includes(labelText) || a.includes(labelText)) { field = f; break; }
    }
  }
  if (!field) return;
  field.focus();
  field.select();
  document.execCommand("insertText", false, value);
}

// ── Trouve le bouton d'ouverture du formulaire "Nouveau rapport medical" ──────

function mcc_findNewReportButton() {
  for (const btn of document.querySelectorAll('button, [role="button"]')) {
    if (btn.closest('[role="dialog"]')) continue;
    const text = btn.textContent.trim().toLowerCase();
    if (text.includes("nouvelle entr") || text.includes("nouvelle entrée")) return btn;
  }
  // Fallback : tout bouton hors dialog contenant "nouveau" ou "+"
  for (const btn of document.querySelectorAll('button, [role="button"]')) {
    if (btn.closest('[role="dialog"]')) continue;
    const text = btn.textContent.trim().toLowerCase();
    if (text.includes("nouveau") || text === "+") return btn;
  }
  return null;
}

// ── Injection différée dans le nouveau formulaire ─────────────────────────────

const mccFormFillObserver = new MutationObserver(() => {
  if (!window.__mcc_pending_vc) return;
  const hasForm = [
    ...document.querySelectorAll('h1, h2, h3, h4, h5, [class*="title"], [class*="Title"]'),
  ].some((el) => el.textContent.trim().includes("Nouveau rapport medical"));
  if (!hasForm) return;

  const data = window.__mcc_pending_vc;
  window.__mcc_pending_vc = null;

  setTimeout(() => {
    mcc_setField("Blessures", data.blessures);
    mcc_setField("Remarque(s)", data.remarques);
    if (data.examens) mcc_setField("Examens", data.examens);
    if (data.traitements) mcc_setField("Traitements", data.traitements);
    if (data.zip) mcc_setField("Code Postal", data.zip);
    setTimeout(() => mcc_setSelectOption("Type", "Note interne"), 50);
  }, 300);
});

mccFormFillObserver.observe(document.body, { childList: true, subtree: true });

// ── Injection du bouton VC dans le dialog de détail ───────────────────────────

function mcc_injectButton(dialog) {
  if (dialog.querySelector(".mcc-vc-btn")) return;
  if (!mcc_hasValidDuration(dialog)) return;

  if (window.getComputedStyle(dialog).position === "static") {
    dialog.style.position = "relative";
  }

  const controlDate = mcc_getFieldValue(dialog, "Date de visite de contrôle");
  const isPassed = mcc_isControlDatePassed(controlDate);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "mcc-vc-btn" + (isPassed ? "" : " mcc-vc-btn--disabled");
  btn.textContent = "VC";
  btn.disabled = !isPassed;
  if (!isPassed) btn.title = "Visite de contrôle non échue";

  btn.addEventListener("click", () => {
    const examensRaw = mcc_getFieldValue(dialog, "Examens") || "";
    const remarquesRaw = mcc_getFieldValue(dialog, "Remarque(s)") || "";
    const traitementsRaw = mcc_getFieldValue(dialog, "Traitements") || "";
    const extras = [];
    if (/canne/i.test(remarquesRaw)) extras.push("Canne récupéré");
    if (/fauteuil/i.test(remarquesRaw)) extras.push("Fauteuil récupéré");
    const remarques = "FDS" + (extras.length ? " + " + extras.join(" + ") : "");
    const traitementsBase = mcc_buildTraitementsRetrait(traitementsRaw);
    const traitements = traitementsBase ? traitementsBase + " // Retrait IPT" : "Retrait IPT";

    mcc_storage.get({ defaultHospitalZip: "1057" }, (data) => {
      window.__mcc_pending_vc = {
        blessures: "VC",
        remarques,
        examens: mcc_buildExamensRAS(examensRaw),
        traitements,
        zip: data.defaultHospitalZip || "",
      };

      // Ferme le dialog via Escape
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })
      );

      // Puis clique sur le bouton "Nouveau rapport"
      setTimeout(() => {
        const newBtn = mcc_findNewReportButton();
        if (newBtn) newBtn.click();
      }, 300);
    });
  });

  dialog.appendChild(btn);

  requestAnimationFrame(() => {
    const firstDivider = dialog.querySelector("hr, .MuiDivider-root");
    const dialogRect = dialog.getBoundingClientRect();
    if (firstDivider) {
      const dividerTop = firstDivider.getBoundingClientRect().top - dialogRect.top;
      btn.style.top = (dividerTop / 2 - btn.offsetHeight / 2) + "px";
    } else {
      btn.style.top = "16px";
    }
  });
}

// ── Détection et observer principal ──────────────────────────────────────────

function mcc_tryInject() {
  const dialog = mcc_findDetailDialog();
  if (dialog) mcc_injectButton(dialog);
}

const mccObserver = new MutationObserver(() => mcc_tryInject());
mccObserver.observe(document.body, { childList: true, subtree: true });
mcc_tryInject();
