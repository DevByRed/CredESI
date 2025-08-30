document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form[name='contact']");
  const popup = document.getElementById("popup");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(form);

      try {
        await fetch("/", { method: "POST", body: formData });
        form.reset();

        // affiche
        popup.classList.add("show");

        // cache après 4s
        setTimeout(() => {
          popup.classList.remove("show");
        }, 4000);
      } catch (err) {
        alert("❌ Erreur d’envoi, réessaie plus tard.");
      }
    });
  }
});
