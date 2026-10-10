const { checkPassword, createSessionCookie } = require('./_lib/auth');
const { isRateLimited } = require('./_lib/rateLimit');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (isRateLimited(event)) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Πολλές προσπάθειες. Δοκιμάστε ξανά σε λίγο.' }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Μη έγκυρο αίτημα.' }) };
  }

  if (!checkPassword(payload.password)) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Λάθος κωδικός.' }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': createSessionCookie(),
    },
    body: JSON.stringify({ ok: true }),
  };
};
