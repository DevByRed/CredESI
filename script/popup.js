async function fetchMaintenance() {
  try {
    const res = await fetch("/.netlify/functions/maintenance");
    const data = await res.json();

    console.log("⏳ Durée :", data.duration, "s");
    console.log("🕒 Fin prévue :", data.endTimeFormatted);

    // Timer basé sur le temps serveur
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
    console.error("Erreur récupération maintenance :", err);
  }
}

fetchMaintenance();
