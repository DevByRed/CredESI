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

/* === Loader ====================================================================================================== */
const AppLoader = (() => {
  const el = document.getElementById("app-loader");

  function show(text = "Chargement…") {
    if (!el) return;
    el.querySelector(".loader-text").textContent = text;
    el.classList.remove("is-hide");
    document.body.style.overflow = "hidden"; // évite le scroll derrière
  }

  function hide() {
    if (!el) return;
    el.classList.add("is-hide");
    // petit délai pour laisser l’anim se terminer
    setTimeout(() => {
      document.body.style.overflow = "";
    }, 500);
  }

  return { show, hide };
})();

/* Nouveaux champs UI */
const isReorientEl = document.getElementById("isReorient");
const yearsElsewhereEl = document.getElementById("yearsElsewhere");

/* ====== Utils ====== */
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
function parseNum(el) {
  const raw = (el?.value || "").toString().replace(",", ".");
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
  if (total === 0)
    return {
      bar: "red",
      kpi: "kpi--red",
      badge: "err",
      text: "Réorientation obligatoire ❌",
    };
  if (total <= 29)
    return {
      bar: "red",
      kpi: "kpi--red",
      badge: "err",
      text: "Remédiation obligatoires (<30 ECTS) 📘",
    };
  if (total <= 44)
    return {
      bar: "yellow",
      kpi: "kpi--yellow",
      badge: "warn",
      text: "Parcours partiellement validé  📑",
    };
  if (total <= 54)
    return {
      bar: "yellow",
      kpi: "kpi--yellow",
      badge: "warn",
      text: "Seuil >= 45 atteint ✅",
    };
  if (total <= 59)
    return {
      bar: "green",
      kpi: "kpi--green",
      badge: "ok",
      text: "Proche du complet  🌿",
    };
  return {
    bar: "green",
    kpi: "kpi--green",
    badge: "ok",
    text: "Bloc 1 terminé (60/60) 🎉",
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

/* ====== Règles Bloc 1 ====== */
function decisionB1(total) {
  if (total === 0) return "Réorientation obligatoire (0/60)";
  if (total === 60) return "Passage au Bloc 2 🎉";
  if (total >= 55)
    return "Proche du complet : PAE jusqu’à 65 ECTS (jury & prérequis)";
  if (total >= 45)
    return "Seuil 45 atteint : PAE ≤ 60 ECTS (Bloc 1 restant + UE de Bloc 2 possibles)";
  if (total >= 30) return "Avancement intermédiaire : consolidation du Bloc 1 ";
  return "Remédiations obligatoires : reprise du Bloc 1 (<30 ECTS)";
}

/**
 * Calcule l'état des inscriptions en Bloc 1, en tenant compte de :
 * - inscriptions déjà faites dans l'école courante (inscPrecSel)
 * - années déjà faites ailleurs (yearsElsewhere)
 * - réorientation cette année (isReorient) => +1 inscription possible
 * - 0 ECTS => réorientation obligatoire uniquement si 1ʳᵉ inscription
 */
function computeInscriptions(total, usedBefore) {
  const isReorient = !!isReorientEl?.checked;
  const yearsElsewhere = clamp(
    parseInt(yearsElsewhereEl?.value || "0", 10),
    0,
    3
  );

  // Inscriptions déjà consommées avant l'année en cours (école + ailleurs)
  const usedBeforeTotal = (usedBefore || 0) + yearsElsewhere;

  // Cap Bloc 1 : 3 tentatives, +1 si réorientation
  const cap = 3 + (isReorient ? 1 : 0);

  const successNow = total === 60;
  const usedAfter = successNow ? usedBeforeTotal : usedBeforeTotal + 1;
  const remaining = Math.max(0, cap - usedAfter);

  const msg = `${usedAfter} utilisée${
    usedAfter > 1 ? "s" : ""
  } → ${remaining} restante${
    remaining > 1 ? "s" : ""
  } (2 supplémentaires si réorientation)`;

  // Alertes
  let alert = null,
    level = null;

  // 0 ECTS => réorientation obligatoire uniquement si 1ʳᵉ inscription (usedBeforeTotal === 0)
  if (!successNow && total === 0 && usedBeforeTotal === 0) {
    alert =
      "⚠️ Réorientation obligatoire si 0 ECTS à la fin de ta 1ʳᵉ inscription.";
    level = "err";
  } else if (!successNow && remaining === 1) {
    alert =
      "⚠️ Il ne restera plus qu’une inscription après cette année (sauf en cas de réorientation, ce qui donne 2 ans en plus ).";
    level = "warn";
  } else if (!successNow && remaining === 0) {
    alert = `⚠️ Nombre maximal d’inscriptions atteint pour ce cadre (${cap}).`;
    level = "err";
  }

  return { msg, alert, level };
}

function writeDetails(total) {
  if (total === 0) {
    res.innerHTML = `
      <p><strong>🔴 0/60 ECTS.</strong></p>
      <ul>
        <li>Réorientation <strong>obligatoire</strong> uniquement si c’est ta <strong>1ʳᵉ inscription</strong>.</li>
        <li>Sinon, tu restes en Bloc 1 avec un PAE composé quasi uniquement des UE de B1 non acquises.</li>
        <li>Aide à la réussite <strong>obligatoire</strong>.</li>
      </ul>`;
    return;
  }
  if (total === 60) {
    res.innerHTML = `
      <p><strong>🎉 Bloc 1 réussi : 60/60 validés.</strong></p>
      <ul>
        <li>Passage en Bloc 2 sans retard.</li>
        <li>Toutes les UE de Bloc 1 sont acquises définitivement.</li>
      </ul>`;
    return;
  }
  if (total >= 55) {
    res.innerHTML = `
      <p><strong>✅ Proche du complet (55–59 ECTS).</strong></p>
      <ul>
        <li>Tu restes administrativement en Bloc 1.</li>
        <li>PAE ≤ 60 ECTS, jusqu’à 65 si jury + prérequis.</li>
      </ul>`;
    return;
  }
  if (total >= 45) {
    res.innerHTML = `
      <p><strong>✅ Seuil 45 atteint (45–54 ECTS).</strong></p>
      <ul>
        <li>Tu restes en Bloc 1.</li>
        <li>PAE ≤ 60 ECTS (B1 restant + UE de B2 possibles, si prérequis remplis).</li>
      </ul>`;
    return;
  }
  if (total >= 30) {
    res.innerHTML = `
      <p><strong>🟡 Avancement intermédiaire (30–44 ECTS).</strong></p>
      <ul>
        <li>Tu restes en Bloc 1.</li>
        <li>PAE ≤ 60 ECTS.</li>
        <li>Aide à la réussite conseillée.</li>
        <li>Le jury peut autoriser quelques UE de B2 si les prérequis sont validés.</li>
      </ul>`;
    return;
  }
  res.innerHTML = `
    <p><strong>🔴 Cumul &lt; 30 ECTS.</strong></p>
    <ul>
      <li>Tu restes en Bloc 1.</li>
      <li>Aide à la réussite <strong>obligatoire</strong>.</li>
      <li>PAE quasi uniquement composé des UE de B1 non acquises.</li>
    </ul>`;
}

/* Ne rien mettre si il n'y a rien */

function clearOutputs() {
  // barre + badge
  bar.style.width = "0%";
  badge.textContent = "";
  badge.classList.remove("err", "warn", "ok");

  // textes
  decisionText.textContent = "";
  inscText.textContent = "";
  inscAlertBox.className = "insc-alert";
  inscAlertBox.textContent = "";
  res.innerHTML = "";

  // kpis (facultatif : les remettre à zéro visuel)
  kAcq0.textContent = "—";
  kRest0.textContent = "—";
  kPAE0.textContent = "—";
  kPrev.textContent = "—";
  kYear.textContent = "—";
  kTotal.textContent = "—";
  kRest.textContent = "—";
}
/* ====== Compute & Render ====== */
function computeAndRender() {
  const used = parseInt(inscPrecSel.value, 10) || 0;

  // valeurs brutes tapées (sans les convertir)
  const vSingle = singleInput?.value?.trim();
  const vPrev = prevInput?.value?.trim();
  const vYear = yearInput?.value?.trim();

  // 👉 si aucune valeur n'est renseignée, on nettoie et on sort
  const noInputFirst = used === 0 && !vSingle;
  const noInputCumul = used > 0 && !vPrev && !vYear;
  if (noInputFirst || noInputCumul) {
    clearOutputs();
    return;
  }

  // --- suite : ton calcul normal ---
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
}
inscPrecSel.addEventListener("change", onChangeInscriptions);
btn.addEventListener("click", computeAndRender);

[singleInput, prevInput, yearInput, yearsElsewhereEl].forEach((el) => {
  el?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") computeAndRender();
  });
});
isReorientEl?.addEventListener("change", computeAndRender);

toggleUI();
computeAndRender();

/* ====== Drawer mobile (compat) ====== */
const drawer = document.getElementById("drawer");
const backdrop = document.getElementById("backdrop");
const btnOpen = document.getElementById("btnOpen");
const btnClose = document.getElementById("btnClose");

function openDrawer() {
  drawer?.classList.add("open");
  backdrop?.classList.add("show");
  btnOpen?.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
}
function closeDrawer() {
  drawer?.classList.remove("open");
  backdrop?.classList.remove("show");
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
function openDrawer2() {
  openDrawer();
  hambox?.classList.add("is-open");
}
function closeDrawer2() {
  closeDrawer();
  hambox?.classList.remove("is-open");
}

