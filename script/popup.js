// Durée de la mise à jour en secondes (ex : 15 minutes = 900s)
//1 h = 3600s
//50 minutes = 3000s
// 40 minutes = 2400s
//30 minutes = 1800s
//20 minutes = 1200s
//15 minutes = 900s
//10 minutes = 600s
let duration = 3600;
let remaining = duration;

function updateTimer() {
  let minutes = Math.floor(remaining / 60);
  let seconds = remaining % 60;
  document.getElementById("timer").textContent = `${minutes}:${
    seconds < 10 ? "0" : ""
  }${seconds}`;

  let progress = ((duration - remaining) / duration) * 100;
  document.getElementById("progress").style.width = progress + "%";

  if (remaining > 0) {
    remaining--;
    setTimeout(updateTimer, 1000);
  } else {
    document.getElementById("update-banner").innerHTML =
      "<p>✅ Mise à jour terminée !</p>";
  }
}

updateTimer();
