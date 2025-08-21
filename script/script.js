/* ====== DOM ====== */
const inscPrecSel = document.getElementById("inscPrec");
const singleInput = document.getElementById("singleCredits");
const cumulWrap = document.getElementById("cumulInputs");
const prevInput = document.getElementById("prevCredits");
const yearInput = document.getElementById("yearCredits");
const btn = document.getElementById("checkBtn");

const badge = document.getElementById("statusBadge");
const bar = document.getElementById("bar");

const kpisZero = document.getElementById("kpisZero");
const kpiCA0 = document.getElementById("kpi_ca0");
const kAcq0 = document.getElementById("k_acquis0");
const kRest0 = document.getElementById("k_restants0");
const kPAE0 = document.getElementById("k_pae0");

const kpisPlus = document.getElementById("kpisPlus");
const kpiTotal = document.getElementById("kpi_total");
const kTotal = document.getElementById("k_total");
const kRest = document.getElementById("k_rest");
const kPrev = document.getElementById("k_prev");
const kYear = document.getElementById("k_year");

const decisionText = document.getElementById("decisionText");
const inscText = document.getElementById("inscText");
const inscAlertBox = document.getElementById("inscAlert");
const res = document.getElementById("result");

/* ====== Utils ====== */
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
function parseNum(el) {
  const raw = (el.value || "").toString().replace(",", ".");
  const n = Number(raw);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

/* ====== UI sync ====== */
function toggleUI() {
  const used = parseInt(inscPrecSel.value, 10) || 0;
  if (used === 0) {
    cumulWrap.classList.add("hidden");
    singleInput.classList.remove("hidden");
    kpisZero.classList.remove("hidden");
    kpisPlus.classList.add("hidden");
  } else {
    cumulWrap.classList.remove("hidden");
    singleInput.classList.add("hidden");
    kpisZero.classList.add("hidden");
    kpisPlus.classList.remove("hidden");
  }
}

function colorByTotal(total) {
  if (total <= 29)
    return {
      bar: "red",
      kpi: "kpi--red",
      badge: "err",
      text: "Consolidation nécessaire 🔧",
    };
  if (total <= 44)
    return {
      bar: "yellow",
      kpi: "kpi--yellow",
      badge: "warn",
      text: "Parcours partiellement validé 📑",
    };
  return {
    bar: "green",
    kpi: "kpi--green",
    badge: "ok",
    text: "Situation favorable 🌿",
  };
}
function applyColors(total, kpiNode) {
  bar.className = "bar";
  kpiNode.classList.remove("kpi--red", "kpi--yellow", "kpi--green");
  badge.classList.remove("err", "warn", "ok");
  const cfg = colorByTotal(total);
  bar.classList.add(cfg.bar);
  kpiNode.classList.add(cfg.kpi);
  badge.classList.add(cfg.badge);
  badge.textContent = cfg.text;
}
const setBarWidth = (total) => {
  bar.style.width = (clamp(total, 0, 60) / 60) * 100 + "%";
};

/* ====== Règles ====== */
function decisionB1(total) {
  if (total === 60) return "Passage au bloc suivant";
  if (total >= 55)
    return "Proche du complet : PAE jusqu’à 65 ECTS (jury & prérequis)";
  if (total >= 45)
    return "Seuil 45 atteint : PAE ≤ 60 ECTS (reliquats B1 + UE de B2 possibles)";
  if (total >= 30)
    return "Consolidation prioritaire du B1 (quelques UE de B2 possibles, jury & prérequis)";
  return "Reprise du Bloc 1 (priorité aux UE de base)";
}

function computeInscriptions(total, usedBefore) {
  const successNow = total === 60;
  const usedAfter = successNow ? usedBefore : usedBefore + 1;
  const remaining = Math.max(0, 2 - usedAfter);
  const msg = `${usedAfter} utilisée${
    usedAfter > 1 ? "s" : ""
  } → ${remaining} restante${remaining > 1 ? "s" : ""}`;
  let alert = null,
    level = null;
  if (!successNow && usedAfter >= 3) {
    alert =
      "⚠️ Réorientation à envisager (3 inscriptions atteintes pour ce bloc)";
    level = "err";
  } else if (!successNow && remaining === 1) {
    alert =
      "Attention : il ne restera plus qu’une inscription après cette année";
    level = "warn";
  }
  return { msg, alert, level };
}

function writeDetails(total) {
  if (total === 60) {
    res.innerHTML = `
            <p><strong>🎉 60/60 validés sur l’ensemble du Bloc 1.</strong></p>
            <ul>
              <li>Passage en <strong>Bloc 2</strong> sans retard.</li>
              <li>Toutes les UE de Bloc 1 sont <strong>acquises définitivement</strong>.</li>
              <li>Ton programme suivant contiendra uniquement des <strong>UE de Bloc 2</strong>.</li>
            </ul>
            <p class="muted">Résumé : premier niveau terminé, tu avances sereinement.</p>`;
    return;
  }
  if (total >= 55) {
    const rest = 60 - total;
    res.innerHTML = `
            <p><strong>✅ Proche du complet :</strong> il manque <strong>${rest}</strong> ECTS sur le cumul du bloc.</p>
            <ul>
              <li>Tu restes administrativement en <strong>Bloc 1</strong>.</li>
              <li>Ton <strong>PAE</strong> doit inclure les UE non acquises de B1 et (si <strong>jury</strong> d’accord et <strong>prérequis</strong>) des <strong>UE de B2</strong>.</li>
              <li>Avec ≥55 ECTS, le PAE peut aller jusqu’à <strong>65 ECTS</strong>.</li>
            </ul>
            <p class="muted">Résumé : tu avances presque normalement vers le Bloc 2.</p>`;
    return;
  }
  if (total >= 45) {
    const rest = 60 - total;
    res.innerHTML = `
            <p><strong>✅ Seuil de 45 ECTS atteint (cumul bloc).</strong> Il reste <strong>${rest}</strong> ECTS à valider.</p>
            <ul>
              <li>Tu restes administrativement en <strong>Bloc 1</strong>.</li>
              <li><strong>PAE ≤ 60 ECTS</strong> : UE ratées de B1 + (si <strong>jury</strong> & <strong>prérequis</strong>) des <strong>UE de B2</strong>.</li>
            </ul>
            <p class="muted">Résumé : tu peux déjà commencer des UE de Bloc 2 en parallèle.</p>`;
    return;
  }
  if (total >= 30) {
    res.innerHTML = `
            <p><strong>🟡 Avancement intermédiaire (cumul 30–44 ECTS).</strong></p>
            <ul>
              <li>Tu restes en <strong>Bloc 1</strong>.</li>
              <li>Ton <strong>PAE</strong> doit d’abord reprendre les <strong>UE de Bloc 1 non acquises</strong>.</li>
              <li>Le <strong>jury</strong> peut autoriser quelques <strong>UE de B2</strong> (si <strong>prérequis</strong> remplis), total ≤ <strong>60 ECTS</strong>.</li>
              <li>Des <strong>activités d’aide à la réussite</strong> peuvent être proposées.</li>
            </ul>
            <p class="muted">Résumé : consolide d’abord le Bloc 1 ; un peu de Bloc 2 si autorisé.</p>`;
    return;
  }
  res.innerHTML = `
          <p><strong>🔴 Cumul &lt; 30 ECTS.</strong></p>
          <ul>
            <li>Tu restes en <strong>Bloc 1</strong>.</li>
            <li>Ton <strong>PAE</strong> sera quasi entièrement composé des <strong>UE de Bloc 1 non acquises</strong>.</li>
            <li><strong>Aide à la réussite</strong> recommandée/organisée.</li>
            <li>Pas d’UE de Bloc 2 avant les <strong>prérequis</strong>.</li>
          </ul>
          <p class="muted">Résumé : reconstruis une base solide avec l’accompagnement.</p>`;
}

/* ====== Compute & Render ====== */
function computeAndRender() {
  const used = parseInt(inscPrecSel.value, 10) || 0;
  let total = 0,
    prev = 0,
    year = 0;

  if (used === 0) {
    total = clamp(parseNum(singleInput), 0, 60);
    prev = 0;
    year = total;
    kAcq0.textContent = total;
    kRest0.textContent = 60 - total;
    kPAE0.textContent = 60;
    applyColors(total, kpiCA0);
  } else {
    prev = clamp(parseNum(prevInput), 0, 60);
    year = clamp(parseNum(yearInput), 0, 60);
    total = clamp(prev + year, 0, 60);
    kPrev.textContent = prev;
    kYear.textContent = year;
    kTotal.textContent = total;
    kRest.textContent = 60 - total;
    applyColors(total, kpiTotal);
  }

  setBarWidth(total);
  decisionText.textContent = decisionB1(total);
  const insc = computeInscriptions(total, used);
  inscText.textContent = insc.msg;
  inscAlertBox.className = "insc-alert";
  inscAlertBox.textContent = "";
  if (insc.alert) {
    inscAlertBox.classList.add("show", insc.level === "err" ? "err" : "warn");
    inscAlertBox.textContent = insc.alert;
  }
  writeDetails(total);
}

function onChangeInscriptions() {
  toggleUI();
  computeAndRender();
}
inscPrecSel.addEventListener("change", onChangeInscriptions);
document.getElementById("checkBtn").addEventListener("click", computeAndRender);
[singleInput, prevInput, yearInput].forEach((el) =>
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter") computeAndRender();
  })
);

toggleUI();
computeAndRender();

// === Drawer mobile ===
const drawer = document.getElementById("drawer");
const backdrop = document.getElementById("backdrop");
const btnOpen = document.getElementById("btnOpen");
const btnClose = document.getElementById("btnClose");

function openDrawer() {
  drawer.classList.add("open");
  backdrop.classList.add("show");
  btnOpen?.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden"; // empêche le scroll derrière
}
function closeDrawer() {
  drawer.classList.remove("open");
  backdrop.classList.remove("show");
  btnOpen?.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
}

btnOpen?.addEventListener("click", openDrawer);
btnClose?.addEventListener("click", closeDrawer);
backdrop?.addEventListener("click", closeDrawer);
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeDrawer();
});

const hambox = document.querySelector(".hambox");

function openDrawer() {
  drawer.classList.add("open");
  backdrop.classList.add("show");
  btnOpen?.setAttribute("aria-expanded", "true");
  hambox?.classList.add("is-open"); // <-- AJOUT
  document.body.style.overflow = "hidden";
}

function closeDrawer() {
  drawer.classList.remove("open");
  backdrop.classList.remove("show");
  btnOpen?.setAttribute("aria-expanded", "false");
  hambox?.classList.remove("is-open"); // <-- AJOUT
  document.body.style.overflow = "";
}

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
      a.download = "Rapport_Bloc1.pdf";
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
        "Impossible de générer le PDF (vérifie l’URL du modèle et réessaie).";
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

/* =======================================================
   Calculateur ECTS – CredESI (accordéon + liste B1)
   ======================================================= */

// ----- Chargement depuis la Function -----
let B1_COURSES = [];

async function loadCoursesFromServer() {
  const res = await fetch("/.netlify/functions/ects", { cache: "no-store" });
  if (!res.ok) throw new Error("API ECTS: HTTP " + res.status);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0)
    throw new Error("API ECTS: JSON vide");
  B1_COURSES = data; // {id,name,ects,q}
}

const ectsAccordion = document.getElementById("ects-accordion");
const ectsBadge = document.getElementById("ects-badge");
const listEl = document.getElementById("ects-list");
const sumEl = document.getElementById("ects-sum");
const barEl = document.getElementById("ects-progress");
const tabs = [...document.querySelectorAll(".ects-tab")];
const searchEl = document.getElementById("ects-search");
const resetBtn = document.getElementById("ects-reset");
const copyBtn = document.getElementById("ects-copy");

const STORAGE_SEL = "credesi.b1.selectedCourses";
const STORAGE_ACO = "credesi.b1.ectsAccordionOpen";
const selected = new Set(JSON.parse(localStorage.getItem(STORAGE_SEL) || "[]"));
let currentTab = "ALL";
let currentQuery = "";

function saveSelected() {
  localStorage.setItem(STORAGE_SEL, JSON.stringify([...selected]));
}
function totalECTS() {
  const sum = B1_COURSES.reduce(
    (s, c) => s + (selected.has(c.id) ? c.ects : 0),
    0
  );
  return Math.min(sum, 60); // pour la barre (affichage)
}
function updateSummary() {
  const t = totalECTS();
  sumEl.textContent = t;
  if (barEl) {
    barEl.style.width = (t / 60) * 100 + "%";
    barEl.style.background = t > 60 ? "#fb923c" : "#2F5AFF";
  }
  if (ectsBadge) ectsBadge.textContent = `${t}/60`;
}
function renderList() {
  listEl.innerHTML = "";
  B1_COURSES.filter((c) => currentTab === "ALL" || c.q === currentTab)
    .filter((c) => (c.name || "").toLowerCase().includes(currentQuery))
    .forEach((c) => {
      const row = document.createElement("div");
      row.className = "ects-row" + (selected.has(c.id) ? " is-checked" : "");
      const left = document.createElement("label");
      left.className = "ects-left";
      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.checked = selected.has(c.id);
      const name = document.createElement("span");
      name.className = "ects-name";
      name.textContent = c.name;
      const badge = document.createElement("div");
      badge.className = "ects-badge-ects";
      badge.textContent = `+${c.ects} ECTS`;

      chk.addEventListener("change", () => {
        chk.checked ? selected.add(c.id) : selected.delete(c.id);
        saveSelected();
        renderList();
        updateSummary();
      });

      left.appendChild(chk);
      left.appendChild(name);
      row.appendChild(left);
      row.appendChild(badge);
      listEl.appendChild(row);
    });
}

// Onglets
tabs.forEach((t) =>
  t.addEventListener("click", () => {
    tabs.forEach((x) => {
      x.classList.remove("is-active");
      x.setAttribute("aria-selected", "false");
    });
    t.classList.add("is-active");
    t.setAttribute("aria-selected", "true");
    currentTab = t.dataset.tab;
    renderList();
    updateSummary();
  })
);

// Recherche
searchEl?.addEventListener("input", () => {
  currentQuery = searchEl.value.trim().toLowerCase();
  renderList();
  updateSummary();
});

// Réinitialiser
resetBtn?.addEventListener("click", () => {
  selected.clear();
  saveSelected();
  renderList();
  updateSummary();
});

// Copier le total (optionnel)
copyBtn?.addEventListener("click", async () => {
  const t = sumEl?.textContent || "0";
  try {
    await navigator.clipboard.writeText(`${t}/60 ECTS`);
    const old = copyBtn.textContent;
    copyBtn.textContent = "✅ Copié";
    setTimeout(() => (copyBtn.textContent = old), 1200);
  } catch {
    alert("Copie impossible sur ce navigateur.");
  }
});

// Mémoriser l’état de l’accordéon
ectsAccordion?.addEventListener("toggle", () => {
  try {
    localStorage.setItem(STORAGE_ACO, ectsAccordion.open ? "1" : "0");
  } catch {}
});
(() => {
  try {
    if (localStorage.getItem(STORAGE_ACO) === "1") ectsAccordion.open = true;
  } catch {}
})();

// Init (on attend d'abord l'API, sinon fallback)
// ----- Init -----
(async function initECTS() {
  try {
    await loadCoursesFromServer();
  } catch (e) {
    console.warn("Impossible de charger les cours depuis l’ESI :", e);
    B1_COURSES = []; // (tu peux mettre un fallback local ici si tu veux)
  }
  renderList();
  updateSummary();
})();
