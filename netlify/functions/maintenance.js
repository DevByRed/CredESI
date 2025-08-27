// netlify/functions/maintenance.js

let endTime = null; // Variable globale, partagée entre les appels

export async function handler(event, context) {
  // Durée de la mise à jour en secondes (tu modifies seulement ça)
  // 1h = 3600s, 50min = 3000s, 40min = 2400s, 30min = 1800s, 20min = 1200s, 15min = 900s, 10min = 600s
  const duration = 1800;

  // Heure actuelle côté serveur
  const now = Date.now();

  // Si endTime n’est pas encore défini, on le calcule UNE SEULE FOIS
  if (!endTime) {
    endTime = now + duration * 1000;
  }

  // Retourne JSON au client
  return {
    statusCode: 200,
    body: JSON.stringify({
      duration, // durée totale
      now, // timestamp actuel
      endTime, // timestamp de fin fixé
      endTimeFormatted: new Date(endTime).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }),
  };
}
