// netlify/functions/maintenance.js

// ─── CONFIG ─────────────────────────────────────────────────────────────
// Mets ta date de fin locale (Europe/Brussels) SANS fuseau.
// Format attendu : "YYYY-MM-DDTHH:mm:ss"
const manualEnd = "2025-08-28T00:53:00"; // ← change ici la date de fin

// Si tu fournis manualStart, il sera utilisé (même format que manualEnd).
// Sinon, start sera fixé automatiquement au moment où ce fichier est chargé (moduleStart).
const manualStart = ""; // optionnel : "2025-08-28T00:00:00"

// Si tu ne fournis ni manualStart ni manualEnd correcte, fallbackTotalSeconds servira comme durée.
const fallbackTotalSeconds = 3600; // durée par défaut (1h)

// Pour l'affichage en Europe/Brussels
const DISPLAY_TZ = "Europe/Brussels";

// En-têtes anti-cache
const noCache = {
  "Cache-Control":
    "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

// ─── UTIL: gestion DST Europe/Brussels (conversion locale→UTC) ────────────
function lastSundayDateOfMonthUTC(year, monthIndex) {
  const last = new Date(Date.UTC(year, monthIndex + 1, 0));
  const dow = last.getUTCDay(); // 0=dim ... 6=sam
  return last.getUTCDate() - dow;
}

function isBrusselsDST(year, month, day, hour) {
  // month: 1..12
  const marchLast = lastSundayDateOfMonthUTC(year, 2); // mars
  const octLast = lastSundayDateOfMonthUTC(year, 9); // octobre
  if (month < 3 || month > 10) return false;
  if (month > 3 && month < 10) return true;
  if (month === 3) {
    return day > marchLast || (day === marchLast && hour >= 2);
  }
  if (month === 10) {
    return day < octLast || (day === octLast && hour < 3);
  }
  return false;
}

function parseLocalBrusselsToUTC(dateStr) {
  // "YYYY-MM-DDTHH:mm[:ss]" -> epoch ms (UTC) en assumant Europe/Brussels
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
    dateStr
  );
  if (!m) return NaN;
  const year = +m[1],
    month = +m[2],
    day = +m[3];
  const hour = +m[4],
    minute = +m[5],
    second = +(m[6] ?? 0);

  const dst = isBrusselsDST(year, month, day, hour);
  const offsetMinutes = dst ? 120 : 60; // +02:00 été, +01:00 hiver

  // Construire UTC ms en retirant l'offset local
  const utcMs =
    Date.UTC(year, month - 1, day, hour, minute, second) -
    offsetMinutes * 60 * 1000;
  return utcMs;
}

// ─── MODULE-LEVEL : start fixé au chargement du module (persistant jusqu'au redeploy)
const moduleStart = Date.now(); // ← fixé une seule fois, au "cold start" de la function

// ─── HANDLER ───────────────────────────────────────────────────────────────
export async function handler() {
  // parse endTime (toujours requis)
  const endTime = parseLocalBrusselsToUTC(manualEnd);
  if (Number.isNaN(endTime)) {
    return {
      statusCode: 400,
      headers: noCache,
      body: JSON.stringify({
        error: "manualEnd invalide. Format attendu: YYYY-MM-DDTHH:mm:ss",
        example: "2025-08-29T15:30:00",
      }),
    };
  }

  // startTime : priorité à manualStart si fourni, sinon moduleStart (moment du chargement)
  let startTime;
  if (manualStart && manualStart.trim() !== "") {
    startTime = parseLocalBrusselsToUTC(manualStart);
    if (Number.isNaN(startTime)) {
      return {
        statusCode: 400,
        headers: noCache,
        body: JSON.stringify({
          error: "manualStart invalide. Format attendu: YYYY-MM-DDTHH:mm:ss",
        }),
      };
    }
  } else {
    startTime = moduleStart;
  }

  // Si par malheur start > end, on utilise fallbackTotalSeconds pour assurer un total positif
  let totalSeconds = Math.floor((endTime - startTime) / 1000);
  if (totalSeconds <= 0) {
    totalSeconds = Math.max(1, fallbackTotalSeconds);
    // recalculer startTime pour correspondre au total fallback (on place start à end - fallback)
    startTime = endTime - totalSeconds * 1000;
  }

  const now = Date.now();
  const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
  const active = remaining > 0;

  return {
    statusCode: 200,
    headers: noCache,
    body: JSON.stringify({
      active,
      startTime,
      endTime,
      totalSeconds, // durée totale (fixe tant que moduleStart reste)
      remaining, // décompte côté serveur
      endTimeFormatted: new Date(endTime).toLocaleString("fr-FR", {
        timeZone: DISPLAY_TZ,
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
