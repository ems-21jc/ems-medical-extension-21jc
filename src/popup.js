const api = typeof browser !== "undefined" ? browser : chrome;
const storage = api.storage.local;

// 🔗 CONFIGURATION DES LIENS EN FONCTION DE L'HÔPITAL CHOISI
const URLS_CONFIG = {
  BCES: {
    bces: "https://docs.google.com/spreadsheets/d/1Vho76MbebIo4d1RgpVL0wGFqbMjeK1e3HcirZV_C7Uk", // Lien dispatch BCES quand on est à l'hôpital BCES
    lses: "https://lses-link.web.app/", // Lien dispatch LSES quand on est à l'hôpital BCES
    intra21: "https://intra.21jumpclick.fr/", // Lien Intra-21 quand on est à l'hôpital BCES
  },
  LSES: {
    bces: "https://docs.google.com/spreadsheets/d/1Vho76MbebIo4d1RgpVL0wGFqbMjeK1e3HcirZV_C7Uk", // Lien dispatch BCES quand on est à l'hôpital LSES
    lses: "https://lses-inventory.web.app/", // Lien dispatch LSES quand on est à l'hôpital LSES
    intra21: "https://intra.21jumpclick.fr/", // Lien Intra-21 quand on est à l'hôpital LSES
  },
};

// 📮 CODE ZIP PAR DÉFAUT SELON L'HÔPITAL
//    → Utilisé comme valeur initiale et remplacé automatiquement
//      quand l'utilisateur change d'hôpital (sauf s'il a personnalisé son ZIP).
const ZIP_CONFIG = {
  BCES: 1057,
  LSES: 8040,
};

// Retourne le code ZIP par défaut pour un hôpital (string pour <input type="number">)
const getDefaultZip = (hospitalKey) => {
  const zip = ZIP_CONFIG[hospitalKey];
  return zip !== undefined ? String(zip) : "";
};

// Liste des valeurs de ZIP_CONFIG (pour détecter si le ZIP courant est un "défaut")
const getAllDefaultZips = () => Object.values(ZIP_CONFIG).map(String);

// ── Titre + Footer : nom + version depuis le manifest ──────────────────────
function renderManifestInfo() {
  const runtime = (typeof browser !== "undefined" ? browser : chrome).runtime;
  if (!runtime || !runtime.getManifest) {
    console.warn("[popup] runtime.getManifest non disponible");
    return;
  }
  const manifest = runtime.getManifest();
  if (!manifest) {
    console.warn("[popup] manifest non trouvé");
    return;
  }

  const fullName = manifest.name || "EMS Medical Extension";

  console.log(
    "[popup] manifest.name:",
    fullName,
    "| version:",
    manifest.version,
  );

  const titleEl = document.getElementById("popupTitleText");
  if (titleEl) {
    titleEl.textContent = fullName;
    console.log("[popup] titre mis à jour:", titleEl.textContent);
  } else {
    console.warn("[popup] #popupTitleText introuvable");
  }

  const footer = document.getElementById("popupFooter");
  if (footer) {
    footer.innerHTML = `<img src="icons/icon16.png" alt=""> ${fullName} • v${manifest.version}`;
  }
}

// ── Bannière d'épinglage ─────────────────────────────────────────────────
async function initPinBanner() {
  const banner = document.getElementById("pinBanner");
  const helpBtn = document.getElementById("pinBannerHelp");
  const closeBtn = document.getElementById("pinBannerClose");
  if (!banner) return;

  // 1. Demande au service worker si l'extension est épinglée
  let isOnToolbar = null; // null = on ne sait pas (Firefox par ex.)
  let dismissed = false;
  try {
    if (api.runtime?.sendMessage) {
      const response = await api.runtime.sendMessage({
        type: "checkPinStatus",
      });
      if (response) {
        isOnToolbar = response.isOnToolbar;
        dismissed = !!response.dismissed;
      }
    }
  } catch (err) {
    console.warn("[popup] impossible de joindre le background:", err);
  }

  // 2. Décide d'afficher ou non la bannière
  //    - Si l'API répond que l'extension est épinglée → on masque
  //    - Si l'utilisateur a déjà cliqué sur "×" → on masque
  //    - Sinon → on affiche
  const shouldShow =
    !dismissed && (isOnToolbar === false || isOnToolbar === null);
  if (shouldShow) {
    banner.style.display = "flex";
  } else {
    banner.style.display = "none";
    return;
  }

  // 3. Bouton "Comment faire ?" → ouvre la page d'aide
  if (helpBtn) {
    helpBtn.addEventListener("click", async () => {
      const url = api.runtime.getURL("welcome.html");
      // Ouvre dans un nouvel onglet, puis ferme le popup
      await api.tabs.create({ url });
      window.close();
    });
  }

  // 4. Bouton "×" → dismiss la bannière
  if (closeBtn) {
    closeBtn.addEventListener("click", async () => {
      banner.style.display = "none";
      try {
        await api.runtime.sendMessage({ type: "dismissPinPrompt" });
      } catch (err) {
        console.warn("[popup] impossible de dismiss:", err);
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  renderManifestInfo();
  await initPinBanner();

  const zipInput = document.getElementById("defaultZip");
  const hospitalSelect = document.getElementById("hospitalSelect");
  const statusMsg = document.getElementById("status");

  const linkBCES = document.getElementById("linkBCES");
  const linkLSES = document.getElementById("linkLSES");
  const linkIntra21 = document.getElementById("linkIntra21");

  // Met à jour les liens href des boutons en fonction du choix
  const updateLinks = (hospitalKey) => {
    const links = URLS_CONFIG[hospitalKey] || URLS_CONFIG["BCES"]; // Fallback au cas où la clé serait inconnue

    linkBCES.href = links.bces;
    linkLSES.href = links.lses;
    linkIntra21.href = links.intra21;
  };

  const showStatus = () => {
    statusMsg.style.opacity = "1";
    setTimeout(() => {
      statusMsg.style.opacity = "0";
    }, 1000);
  };

  // 1. Charger la configuration
  //    ⚠️ Pas de valeur par défaut codée en dur pour le ZIP : on le déduit
  //    de l'hôpital sélectionné via ZIP_CONFIG.
  const data = await storage.get({
    selectedHospital: "BCES",
    defaultHospitalZip: null,
    isUnlocked: false,
  });

  // Si aucun ZIP n'a encore été enregistré, on prend celui de l'hôpital actuel
  const initialZip =
    data.defaultHospitalZip || getDefaultZip(data.selectedHospital);

  zipInput.value = initialZip;
  hospitalSelect.value = data.selectedHospital;

  // Synchronise le storage avec la valeur résolue
  if (!data.defaultHospitalZip) {
    await storage.set({ defaultHospitalZip: initialZip });
  }

  // Appliquer les bons liens dès l'ouverture
  updateLinks(data.selectedHospital);

  // 2. Changement de l'Hôpital Actuel (LSES / BCES)
  //    → Met aussi à jour le ZIP par défaut, SAUF si l'utilisateur
  //      avait personnalisé une autre valeur.
  hospitalSelect.addEventListener("change", async () => {
    const currentHospital = hospitalSelect.value;
    const currentZip = zipInput.value;
    const defaultZips = getAllDefaultZips();

    // Si le ZIP actuel est encore un défaut (ou vide), on bascule
    // vers le nouveau défaut de l'hôpital. Sinon, on respecte le choix.
    if (!currentZip || defaultZips.includes(currentZip)) {
      const newZip = getDefaultZip(currentHospital);
      zipInput.value = newZip;
      await storage.set({ defaultHospitalZip: newZip });
    }

    await storage.set({ selectedHospital: currentHospital });
    updateLinks(currentHospital);
    showStatus();
  });

  // 3. Changement du code ZIP
  zipInput.addEventListener("input", async () => {
    await storage.set({ defaultHospitalZip: zipInput.value });
    showStatus();
  });
});
