const crypto = require('crypto');
const config = require('./config');

const SESSION_COOKIE = 'admin_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 ώρες

function hmac(secret, value) {
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// --- Admin session cookie: "<expiryMs>.<hmac>" -----------------
function createSessionCookie() {
  const expiry = String(Date.now() + SESSION_TTL_MS);
  const sig = hmac(config.ADMIN_SESSION_SECRET(), expiry);
  const value = `${expiry}.${sig}`;
  const secure = process.env.CONTEXT !== 'dev'; // netlify dev τρέχει σε http
  return `${SESSION_COOKIE}=${value}; HttpOnly; Path=/; Max-Age=${SESSION_TTL_MS / 1000}; SameSite=Strict${secure ? '; Secure' : ''}`;
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`;
}

function parseCookies(header) {
  const out = {};
  (header || '').split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    out[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  });
  return out;
}

function isValidSession(cookieHeader) {
  const cookies = parseCookies(cookieHeader);
  const raw = cookies[SESSION_COOKIE];
  if (!raw) return false;
  const [expiry, sig] = raw.split('.');
  if (!expiry || !sig) return false;
  if (Number(expiry) < Date.now()) return false;
  const expected = hmac(config.ADMIN_SESSION_SECRET(), expiry);
  return timingSafeEqual(sig, expected);
}

function checkPassword(candidate) {
  if (typeof candidate !== 'string' || !candidate) return false;
  return timingSafeEqual(candidate, config.ADMIN_PASSWORD());
}

// --- Unsubscribe tokens: "<waitlistId>.<hmac>" -----------------
function signUnsubscribeToken(waitlistId) {
  const sig = hmac(config.UNSUBSCRIBE_SECRET(), waitlistId);
  return `${waitlistId}.${sig}`;
}

function verifyUnsubscribeToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const idx = token.lastIndexOf('.');
  const waitlistId = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = hmac(config.UNSUBSCRIBE_SECRET(), waitlistId);
  if (!sig || !timingSafeEqual(sig, expected)) return null;
  return waitlistId;
}

module.exports = {
  createSessionCookie,
  clearSessionCookie,
  isValidSession,
  checkPassword,
  signUnsubscribeToken,
  verifyUnsubscribeToken,
};
