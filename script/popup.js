// Durée de la mise à jour en secondes (ex : 15 minutes = 900s)
// 1h = 3600s, 50min = 3000s, 40min = 2400s, 30min = 1800s, 20min = 1200s, 15min = 900s, 10min = 600s
let duration = 600; // <-- tu modifies juste ça

// On récupère la date de fin dans le localStorage ou on la définit
let endTime = localStorage.getItem("updateEndTime");

if (!endTime) {
  // Si aucune date de fin stockée → on en crée une nouvelle
  endTime = Date.now() + duration * 1000;
  localStorage.setItem("updateEndTime", endTime);
} else {
  endTime = parseInt(endTime);
}

function updateTimer() {
  let now = Date.now();
  let remaining = Math.floor((endTime - now) / 1000);

  if (remaining > 0) {
    let minutes = Math.floor(remaining / 60);
    let seconds = remaining % 60;

    // Affiche le temps
    document.getElementById("timer").textContent = `${minutes}:${
      seconds < 10 ? "0" : ""
    }${seconds}`;

    // Barre de progression
    let progress = ((duration - remaining) / duration) * 100;
    document.getElementById("progress").style.width = progress + "%";

    setTimeout(updateTimer, 1000);
  } else {
    // Mise à jour terminée
    document.getElementById("update-banner").innerHTML =
      "<p>✅ Mise à jour terminée !</p>";
    localStorage.removeItem("updateEndTime"); // On nettoie
  }
}

// Lancer le timer
updateTimer();
