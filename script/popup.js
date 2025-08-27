async function fetchMaintenance() {
  try {
    const res = await fetch("/.netlify/functions/maintenance");
    const data = await res.json();

    console.log("🕒 Fin prévue :", data.endTimeFormatted);

    // Affiche l'heure exacte de fin dans ton HTML (si tu veux)
    const endTimeEl = document.getElementById("end-time");
    if (endTimeEl) {
      endTimeEl.textContent = data.endTimeFormatted;
    }

    // Utilise directement le temps restant envoyé par le serveur
    let remaining = data.remaining;

    const interval = setInterval(() => {
      if (remaining <= 0) {
        clearInterval(interval);
        document.getElementById("countdown").textContent = "✅ Terminé";
      } else {
        let minutes = Math.floor(remaining / 60);
        let seconds = remaining % 60;
        document.getElementById(
          "countdown"
        ).textContent = `${minutes}m ${seconds}s`;
        remaining--;
      }
    }, 1000);
  } catch (err) {
    console.error("❌ Erreur récupération maintenance :", err);
  }
}

fetchMaintenance();
