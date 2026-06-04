const storage = (typeof browser !== "undefined" ? browser : chrome).storage
  .local;

// 🔗 CONFIGURATION DES LIENS EN FONCTION DE L'HÔPITAL CHOISI
const URLS_CONFIG = {
  BCES: {
    bces: "https://docs.google.com/spreadsheets/d/1Vho76MbebIo4d1RgpVL0wGFqbMjeK1e3HcirZV_C7Uk", // Lien dispatch BCES quand on est à l'hôpital BCES
    lses: "https://lses-link.web.app/", // Lien dispatch LSES quand on est à l'hôpital BCES
  },
  LSES: {
    bces: "https://docs.google.com/spreadsheets/d/1Vho76MbebIo4d1RgpVL0wGFqbMjeK1e3HcirZV_C7Uk", // Lien dispatch BCES quand on est à l'hôpital LSES
    lses: "https://lses-inventory.web.app/", // Lien dispatch LSES quand on est à l'hôpital LSES
  },
};

document.addEventListener("DOMContentLoaded", async () => {
  const zipInput = document.getElementById("defaultZip");
  const hospitalSelect = document.getElementById("hospitalSelect");
  const statusMsg = document.getElementById("status");

  const linkBCES = document.getElementById("linkBCES");
  const linkLSES = document.getElementById("linkLSES");

  // Met à jour les liens href des boutons en fonction du choix
  const updateLinks = (hospitalKey) => {
    const links = URLS_CONFIG[hospitalKey] || URLS_CONFIG["LSES"];

    linkBCES.href = links.bces;
    linkLSES.href = links.lses;
  };

  const showStatus = () => {
    statusMsg.style.opacity = "1";
    setTimeout(() => {
      statusMsg.style.opacity = "0";
    }, 1000);
  };

  // 1. Charger la configuration (Par défaut : LSES et ZIP vide)
  const data = await storage.get({
    defaultHospitalZip: "1057",
    selectedHospital: "BCES",
  });

  zipInput.value = data.defaultHospitalZip;
  hospitalSelect.value = data.selectedHospital;

  // Appliquer les bons liens dès l'ouverture
  updateLinks(data.selectedHospital);

  // 2. Changement de l'Hôpital Actuel (LSES / BCES)
  hospitalSelect.addEventListener("change", async () => {
    const currentHospital = hospitalSelect.value;
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
