// netlify/functions/maintenance.js

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// ⚠️ Mets une date avec décalage horaire explicite (DST OK):
// Été (UTC+02:00)  → ..."+02:00"
// Hiver (UTC+01:00) → ..."+01:00"
const manualDate = "2025-08-28T00:35:00+02:00"; // ← à ajuster

// En-têtes anti-cache (CDN, navigateur, SW)
const noCacheHeaders = {
  "Cache-Control":
    "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

// ─── CALCUL ───────────────────────────────────────────────────────────────────
export async function handler() {
  const endTime = Date.parse(manualDate);

  // Date invalide → on évite un NaN qui casserait tout
  if (Number.isNaN(endTime)) {
    return {
      statusCode: 400,
      headers: noCacheHeaders,
      body: JSON.stringify({
        error:
          "manualDate invalide. Utilise le format YYYY-MM-DDTHH:mm:ss±HH:MM",
        example: "2025-08-29T15:30:00+02:00",
      }),
    };
  }

  const now = Date.now();
  const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
  const active = remaining > 0;

  return {
    statusCode: 200,
    headers: noCacheHeaders, // ⛔️ pas de cache
    body: JSON.stringify({
      active,
      endTime,
      remaining, // temps restant calculé serveur (référence unique)
      endTimeFormatted: new Date(endTime).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    }),
  };
}
