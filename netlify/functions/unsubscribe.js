const { getSupabase } = require('./_lib/supabase');
const { verifyUnsubscribeToken } = require('./_lib/auth');

function htmlPage(message) {
  return `<!DOCTYPE html><html lang="el"><head><meta charset="UTF-8">
    <title>Διαγραφή - House Rentals</title>
    <meta name="robots" content="noindex">
    <style>body{font-family:sans-serif;background:#17232D;color:#E7ECEF;
    display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}
    div{max-width:420px;text-align:center;padding:24px;}</style></head>
    <body><div><h2>House Rentals</h2><p>${message}</p></div></body></html>`;
}

exports.handler = async (event) => {
  const token = event.queryStringParameters && event.queryStringParameters.token;
  const waitlistId = verifyUnsubscribeToken(token);

  if (!waitlistId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: htmlPage('Μη έγκυρος ή ληγμένος σύνδεσμος διαγραφής.'),
    };
  }

  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('waitlist')
      .update({ unsubscribed: true })
      .eq('id', waitlistId);
    if (error) throw error;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: htmlPage('Διαγραφήκατε επιτυχώς — δεν θα λάβετε άλλες ειδοποιήσεις για αυτό το διαμέρισμα.'),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: htmlPage('Κάτι πήγε στραβά. Δοκιμάστε ξανά αργότερα.'),
    };
  }
};
