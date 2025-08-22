// PDF generation _______________________________________________________________________________________
// === Télécharger le rapport PDF rempli (pdf-lib) ===

// 0) URL ABSOLUE de ton modèle sur Netlify
const PDF_TEMPLATE_URL = "/pdf/PdfCredESI.pdf"; // même origine, fiable en prod

// 0bis) Détection iOS (y compris iPadOS en mode desktop)
const isIOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

document
  .getElementById("downloadPdfBtn")
  ?.addEventListener("click", generatePdfReport);

async function generatePdfReport() {
  try {
    // 1) Récupérer l'état courant comme dans l'UI
    const usedBefore = parseInt(inscPrecSel.value, 10) || 0;

    let prev = 0,
      year = 0,
      total = 0;
    if (usedBefore === 0) {
      total = clamp(parseNum(singleInput), 0, 60);
      prev = 0;
      year = total;
    } else {
      prev = clamp(parseNum(prevInput), 0, 60);
      year = clamp(parseNum(yearInput), 0, 60);
      total = clamp(prev + year, 0, 60);
    }
    const rest = 60 - total;

    // Décision & inscriptions (tes règles)
    const decision = decisionB1(total);
    const successNow = total === 60;
    const usedAfter = successNow ? usedBefore : usedBefore + 1; // inscription consommée si pas 60/60
    const remaining = Math.max(0, 3 - usedAfter);

    // Synthèse "situation"
    const situation =
      total === 60
        ? "Bloc 1 terminé (60/60)"
        : total >= 55
        ? "Proche du complet (≥55 ECTS)"
        : total >= 45
        ? "Seuil 45 atteint"
        : total >= 30
        ? "Avancement intermédiaire (30–44 ECTS)"
        : "Cumul < 30 ECTS";

    // 2) Charger le modèle PDF (avec champs)
    const resp = await fetch(PDF_TEMPLATE_URL, { cache: "no-store" });
    if (!resp.ok)
      throw new Error(`Fetch PDF failed: ${resp.status} ${resp.statusText}`);
    const templateBytes = await resp.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();

    // 3) Remplir les champs (noms EXACTS du PDF)
    setIfExists(form, "credits_acquis", String(total));
    setIfExists(form, "credits_restants", String(rest));
    setIfExists(form, "total_cumules", String(total)); // juste le nombre

    setIfExists(form, "inscriptions_utilisees", String(usedAfter));
    setIfExists(form, "inscriptions_restantes", String(remaining));

    setIfExists(form, "situation", situation);
    setIfExists(form, "decision", decision);

    // Important pour mobiles: figer les valeurs dans le rendu
    form.flatten();

    // 4) Télécharger / Ouvrir le PDF (compat iOS/Android)
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    if (isIOS) {
      // iOS: ouverture dans un nouvel onglet (ensuite "Partager" -> "Enregistrer dans Fichiers")
      window.open(url, "_blank");
      // Laisse un petit délai avant révoquer l'URL pour éviter de couper le stream
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } else {
      // Android + desktop : téléchargement via <a download>
      const a = document.createElement("a");
      a.href = url;
      a.download = "Rapport_CredESI.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Révoque après un petit délai (certains navigateurs lisent encore l'URL)
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
  } catch (e) {
    console.error("Erreur génération PDF:", e);
    // Feedback simple si besoin
    const box = document.getElementById("downloadBox") || document.body;
    if (!document.querySelector("#pdf-error")) {
      const err = document.createElement("div");
      err.id = "pdf-error";
      err.className = "insc-alert err show";
      err.textContent =
        " 🔄 Veuillez recharger la page et réessayer, plusieurs fois si nécessaire. (C’est une petite erreur qui peut arriver ^^)";
      box.appendChild(err);
    }
  }
}

// Helper: set text si le champ existe
function setIfExists(form, name, value) {
  const field = form.getFields().find((f) => f.getName && f.getName() === name);
  if (!field) {
    console.warn("Champ introuvable :", name);
    return;
  }
  if (field.setText) field.setText(value);
}
