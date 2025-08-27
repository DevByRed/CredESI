// netlify/functions/maintenance.js

// Durée de la mise à jour en secondes (tu modifies seulement ça)
// 1h = 3600s, 50min = 3000s, 40min = 2400s, 30min = 1800s, etc.
const duration = 1800; // 30 min

// Heure du déploiement (au moment où Netlify charge ce fichier)
const startTime = Date.now();

// Heure de fin universelle
const endTime = startTime + duration * 1000;

export async function handler(event, context) {
  // Retourne JSON au client
  return {
    statusCode: 200,
    body: JSON.stringify({
      duration,
      startTime, // début fixé au moment du déploiement
      endTime, // fin fixée au moment du déploiement
      endTimeFormatted: new Date(endTime).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }),
  };
}
