async function fetchMaintenance() {
  try {
    // Bypass cache navigateur + SW
    const res = await fetch("/.netlify/functions/maintenance?t=" + Date.now(), {
      cache: "no-store",
    });
    const data = await res.json();

    const banner = document.getElementById("update-banner");
    const countdownEl = document.getElementById("countdown");
    if (!banner || !countdownEl) return;

    // Si maintenance finie → on masque/termine proprement
    if (!data.active || data.remaining <= 0) {
      countdownEl.textContent = "✅ Terminé";
      // banner.classList.add("hidden"); // décommente si tu veux le cacher
      return;
    }

    // Anti-drift : on ne décrémente pas à l’aveugle.
    // On mesure le temps écoulé avec performance.now() (monotone)
    const initRemaining = data.remaining; // valeur serveur (référence)
    const t0 = performance.now();

    function render() {
      const elapsed = Math.floor((performance.now() - t0) / 1000);
      const remaining = Math.max(0, initRemaining - elapsed);

      if (remaining <= 0) {
        countdownEl.textContent = "✅ Terminé";
        // banner.classList.add("hidden");
        return;
      }
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      countdownEl.textContent = `${m}m ${s}s`;
    }

    // Tick précis + rattrapage après mise en veille d’onglet
    render();
    const interval = setInterval(() => {
      render();
      // Optionnel : re-sync toutes les 60s en re-faisant un fetch
      // (utile si l’onglet a dormi très longtemps)
      // if ((performance.now() - t0) > 60000) { clearInterval(interval); fetchMaintenance(); }
    }, 1000);
  } catch (err) {
    console.error("❌ Erreur récupération maintenance :", err);
  }
}

fetchMaintenance();
