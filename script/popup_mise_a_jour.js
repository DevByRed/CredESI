// popup.js
// Compte à rebours + barre continue qui NE REPART JAMAIS au reload.
// - Récupère data.totalSeconds + data.remaining depuis la Netlify Function
// - Place la barre instantanément au bon %, puis anime normalement
// - Resync au retour d'onglet (visibilitychange), retry automatique en cas d'erreur
// - Finalize propre quand la maintenance est terminée

let tickIntervalId = null;
let lastFetchTime = 0;

// ---------- utilitaires ----------
function pctFromRemaining(total, rem) {
  if (rem <= 0) return 100;
  return Math.min(100, ((total - rem) / total) * 100);
}
function formatTime(s) {
  if (s <= 0) return "✅ Terminé";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}
async function getMaintenance() {
  const url = "/.netlify/functions/maintenance?t=" + Date.now();
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("fetch maintenance failed: " + res.status);
  return res.json();
}

// ---------- affiche un final propre ----------
function finalize(banner, progressEl, endTimeEl, endTimeFormatted) {
  if (!banner) return;
  // Remplacer le contenu par un message simple et propre
  banner.innerHTML = `
    <div class="update-done-content" style="padding:14px 18px; display:flex; align-items:center; gap:12px;">
      <div style="font-size:20px">✅</div>
      <div style="font-weight:700">Mise à jour terminée</div>
      ${
        endTimeFormatted
          ? `<div style="margin-left:auto; opacity:.9; font-size:13px">${endTimeFormatted}</div>`
          : ""
      }
    </div>
  `;
  banner.classList.add("update-done");

  // Remplir ou masquer la barre si elle existe dans l'ancien DOM
  if (progressEl) {
    progressEl.style.transition = "width .2s linear";
    progressEl.style.width = "100%";
  }
}

// ---------- logique principale ----------
async function fetchMaintenanceAndStart() {
  // éviter fetchs trop rapprochés
  const now = Date.now();
  if (now - lastFetchTime < 500) return;
  lastFetchTime = now;

  // nettoyer ancien interval si présent
  if (tickIntervalId) {
    clearInterval(tickIntervalId);
    tickIntervalId = null;
  }

  try {
    const data = await getMaintenance();

    // éléments attendus dans le DOM
    const banner = document.getElementById("update-banner");
    const countdownEl = document.getElementById("countdown");
    const progressEl = document.getElementById("progress");
    const endTimeEl = document.getElementById("end-time"); // optionnel

    if (!banner || !countdownEl) {
      console.warn(
        "popup.js: éléments #update-banner ou #countdown introuvables."
      );
      return;
    }

    // si terminé ou inactif -> finalize propre
    if (
      !data.active ||
      (typeof data.remaining === "number" && data.remaining <= 0)
    ) {
      finalize(banner, progressEl, endTimeEl, data.endTimeFormatted || "");
      return;
    }

    // récupérer totalSeconds (robuste)
    let total = 1;
    if (typeof data.totalSeconds === "number" && data.totalSeconds > 0) {
      total = Math.max(1, Math.floor(data.totalSeconds));
    } else if (data.startTime && data.endTime) {
      total = Math.max(1, Math.floor((data.endTime - data.startTime) / 1000));
    } else {
      total = Math.max(1, Math.floor((data.remaining || 0) + 3600)); // fallback
    }

    const initRemaining = Math.max(0, Math.floor(data.remaining || 0));

    // afficher heure de fin si souhaité
    if (endTimeEl && data.endTimeFormatted) {
      endTimeEl.textContent = data.endTimeFormatted;
    }

    // --- rendu initial : positionne la barre SANS transition pour éviter l'effet "repart de 0" ---
    if (progressEl) {
      const firstPct = pctFromRemaining(total, initRemaining);
      progressEl.style.transition = "none";
      progressEl.style.width = firstPct + "%";
      // forcer reflow
      void progressEl.offsetWidth;
      // réactiver transition
      progressEl.style.transition = "width .4s linear";
    }

    // texte initial
    countdownEl.textContent = formatTime(initRemaining);

    // ticker basé sur performance.now() pour anti-drift
    const t0 = performance.now();
    const baseRem = initRemaining;

    function renderTick() {
      const elapsed = Math.floor((performance.now() - t0) / 1000);
      const remainingNow = Math.max(0, baseRem - elapsed);

      // texte
      countdownEl.textContent = formatTime(remainingNow);

      // barre animée
      if (progressEl) {
        progressEl.style.width = pctFromRemaining(total, remainingNow) + "%";
      }

      if (remainingNow <= 0) {
        clearInterval(tickIntervalId);
        tickIntervalId = null;
        // finalize visuel propre
        finalize(banner, progressEl, endTimeEl, data.endTimeFormatted || "");
        return false;
      }
      return true;
    }

    // lancer
    renderTick();
    tickIntervalId = setInterval(() => {
      const alive = renderTick();
      if (!alive && !tickIntervalId) {
        // optional resync final
        // fetchMaintenanceAndStart();
      }
    }, 1000);
  } catch (err) {
    console.error("Erreur fetchMaintenance:", err);
    // retry après 10s
    setTimeout(fetchMaintenanceAndStart, 10000);
  }
}

// resync au retour en visibilité (utile si onglet a dormi)
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    fetchMaintenanceAndStart();
  }
});

// cleanup à la fermeture
window.addEventListener("beforeunload", () => {
  if (tickIntervalId) clearInterval(tickIntervalId);
});

// démarrage initial
fetchMaintenanceAndStart();
