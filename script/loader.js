// Gestion du splash screen
window.addEventListener("load", () => {
  const splash = document.getElementById("splash-screen");
  if (!splash) return;

  // attendre un peu pour voir l’anim (1.5s ici)
  setTimeout(() => {
    splash.classList.add("hide");
  }, 1500); // change 1500 -> 2000 si tu veux plus long
});
