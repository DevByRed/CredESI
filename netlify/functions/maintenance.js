// netlify/functions/maintenance.js

// ======================
// 🔧 CONFIGURATION
// ======================

// Mets ici la date et l'heure de fin manuellement
// ⚠️ Format : YYYY-MM-DDTHH:mm:ss
// Exemple : "2025-08-29T15:30:00" = 29 août 2025 à 15h30
const manualDate = "2025-08-28T00:30:00";

// ======================
// CALCUL HEURE DE FIN
// ======================
const endTime = new Date(manualDate).getTime();

export async function handler(event, context) {
  const now = Date.now();
  const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

  return {
    statusCode: 200,
    body: JSON.stringify({
      endTime,
      remaining,
      endTimeFormatted: new Date(endTime).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit", // ✅ inclut aussi les secondes
      }),
    }),
  };
}
