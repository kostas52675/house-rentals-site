// Best-effort rate limiting μέσα στη μνήμη του function instance.
// Δεν επιβιώνει σε cold start και δεν μοιράζεται μεταξύ instances,
// αλλά είναι αρκετό ως πρώτο φίλτρο ενάντια σε γρήγορο spam από
// scripts — μαζί με το honeypot field και το unique(unit,email)
// constraint στη βάση καλύπτει το MVP. Για πιο σοβαρή προστασία
// (πραγματικό botting) θα χρειαζόταν κάτι όπως hCaptcha/Turnstile.
const hits = new Map();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_HITS = 8;

function getClientIp(event) {
  const header = event.headers['x-nf-client-connection-ip'] || event.headers['client-ip'] || '';
  return header.split(',')[0].trim() || 'unknown';
}

function isRateLimited(event) {
  const ip = getClientIp(event);
  const now = Date.now();
  const timestamps = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  hits.set(ip, timestamps);
  return timestamps.length > MAX_HITS;
}

module.exports = { isRateLimited };
