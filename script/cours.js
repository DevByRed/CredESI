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
    alert("Impossible de charger les cours depuis l’ESI :", e);
    B1_COURSES = []; // (tu peux mettre un fallback local ici si tu veux)
  }
  renderList();
  updateSummary();
})();
