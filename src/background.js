// src/background.js
// Service worker de l'extension - gère l'installation et le message d'épinglage
// Compatible Chrome MV3 (service_worker) et Firefox MV3 (event page)

const api = typeof browser !== "undefined" ? browser : chrome;
const storage = api.storage.local;

// Clé du flag utilisé pour savoir si l'utilisateur a déjà vu le message
const PIN_FLAG = "pinPromptDismissed";

api.runtime.onInstalled.addListener(async (details) => {
  // Au premier install OU en cas de mise à jour majeure, on remet le flag
  // à false pour redemander à l'utilisateur d'épingler l'extension
  if (details.reason === "install") {
    // Première installation → on affiche la page de bienvenue
    await storage.set({ [PIN_FLAG]: false });

    // Ouvre la page d'instructions dans un nouvel onglet
    const welcomeUrl = api.runtime.getURL("welcome.html");
    api.tabs.create({ url: welcomeUrl });
  } else if (details.reason === "update") {
    // Sur mise à jour, on ne force pas la réapparition
    // (le popup s'occupera d'afficher la bannière si besoin)
    console.log(
      "[background] Extension mise à jour vers",
      details.previousVersion,
    );
  }
});

// À l'ouverture du popup, on peut aussi vérifier si l'utilisateur l'a épinglé
// (Chrome 102+ : chrome.action.getUserSettings().isOnToolbar)
api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "checkPinStatus") {
    (async () => {
      try {
        const result = { isOnToolbar: null, dismissed: false };

        // 1. Vérifie le flag local "l'utilisateur a déjà dismissed la bannière"
        const data = await storage.get({ [PIN_FLAG]: false });
        result.dismissed = !!data[PIN_FLAG];

        // 2. Si l'API est dispo (Chrome/Edge 102+), on l'utilise pour savoir
        //    si l'extension est épinglée à la barre d'outils
        if (api.action && typeof api.action.getUserSettings === "function") {
          const settings = await api.action.getUserSettings();
          result.isOnToolbar = !!settings.isOnToolbar;
        }
        sendResponse(result);
      } catch (err) {
        console.warn("[background] checkPinStatus error:", err);
        sendResponse({ isOnToolbar: null, dismissed: false });
      }
    })();
    // Réponse async → on retourne true
    return true;
  }

  // L'utilisateur a cliqué sur "Compris !" ou "Ne plus afficher"
  if (message?.type === "dismissPinPrompt") {
    storage.set({ [PIN_FLAG]: true });
    sendResponse({ ok: true });
    return false;
  }
});
