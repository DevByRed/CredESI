// netlify/functions/maintenance.js

const duration = 1800; // 30 minutes
const startTime = Date.now();
const endTime = startTime + duration * 1000;

export async function handler(event, context) {
  const now = Date.now();
  const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

  return {
    statusCode: 200,
    body: JSON.stringify({
      duration,
      startTime,
      endTime,
      remaining,
      endTimeFormatted: new Date(endTime).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }),
  };
}
