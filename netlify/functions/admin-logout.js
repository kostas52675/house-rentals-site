const { clearSessionCookie } = require('./_lib/auth');

exports.handler = async () => ({
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Set-Cookie': clearSessionCookie(),
  },
  body: JSON.stringify({ ok: true }),
});
