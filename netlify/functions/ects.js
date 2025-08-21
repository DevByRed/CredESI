// netlify/functions/ects.js
const cheerio = require("cheerio");

/**
 * Construit l'URL de la grille Développement d'application (Bloc 1) pour l'année académique courante.
 * Règle ESI: "ac2425" pour 2024-2025, "ac2526" pour 2025-2026, etc.
 * On considère que l'année académique démarre en AOÛT.
 */
function buildGridUrl() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth(); // 0-11 (août = 7)

  // Calcul automatique
  const startYear = m >= 7 ? y : y - 1;
  let yy = String(startYear).slice(2);
  let zz = String(startYear + 1).slice(2);

  // 🔒 Patch provisoire : si 25-26 n'existe pas encore, forcer 24-25
  if (yy === "25" && zz === "26") {
    yy = "24";
    zz = "25";
  }

  return `https://ects.esi-bru.be/online/grilles/ac${yy}${zz}_eeg.html`;
}

exports.handler = async function () {
  try {
    const url = buildGridUrl();

    // IMPORTANT : certains serveurs refusent sans User-Agent
    const res = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Netlify Functions; +https://www.netlify.com/)",
      },
    });

    if (!res.ok) {
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: `HTTP ${res.status} sur ${url}` }),
      };
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const courses = [];

    // On ne garde que le Quadrimestre 1 et 2
    // La page a des blocs <div id="grille-q1"> et <div id="grille-q2">
    ["#grille-q1", "#grille-q2"].forEach((selector, idx) => {
      const q = idx === 0 ? "Q1" : "Q2";
      $(selector)
        .find("table.grille tr.ue")
        .each((i, el) => {
          const name = $(el).find("td:first h3 a").text().trim();
          const ectsText = $(el)
            .find("td:nth-child(2) h3 strong")
            .text()
            .trim();
          const ects = Number(ectsText);

          if (name && Number.isFinite(ects)) {
            courses.push({
              id: `${q}-${i}`,
              name,
              ects,
              q,
            });
          }
        });
    });

    if (courses.length === 0) {
      // Utile pour diagnostiquer si un selecteur casse un jour
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Aucun cours parsé (vérifie le HTML/selecteurs)",
          url,
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(courses),
      headers: { "content-type": "application/json; charset=utf-8" },
    };
  } catch (err) {
    console.error("Erreur serveur:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Erreur serveur", error: String(err) }),
    };
  }
};
