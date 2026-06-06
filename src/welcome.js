// src/welcome.js
// Script de la page de bienvenue (séparé pour respecter la CSP des extensions MV3)

document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.getElementById("closeBtn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      window.close();
    });
  }
});
