const { getSupabase } = require('./_lib/supabase');
const { sendConfirmationEmail } = require('./_lib/resend');
const { isValidEmail, cleanText } = require('./_lib/validate');
const { isRateLimited } = require('./_lib/rateLimit');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (isRateLimited(event)) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Πολλές αιτήσεις. Δοκιμάστε ξανά σε λίγο.' }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Μη έγκυρο αίτημα.' }) };
  }

  // Honeypot: αόρατο πεδίο στη φόρμα — μόνο bots το συμπληρώνουν.
  if (payload.botField) {
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true }) };
  }

  const unitId = cleanText(payload.unitId, 100);
  const email = (payload.email || '').trim();
  const name = cleanText(payload.name, 100);
  const phone = cleanText(payload.phone, 40);

  if (!unitId || !isValidEmail(email)) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Χρειάζεται έγκυρο email και διαμέρισμα.' }),
    };
  }

  try {
    const supabase = getSupabase();

    const { data: unit, error: unitError } = await supabase
      .from('units')
      .select('id, label, location_name, rented')
      .eq('id', unitId)
      .maybeSingle();

    if (unitError) throw unitError;
    if (!unit) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Το διαμέρισμα δεν βρέθηκε.' }),
      };
    }

    // Upsert: αν το email έχει ήδη εγγραφεί για αυτό το unit, δεν
    // δημιουργείται δεύτερη εγγραφή (unique constraint unit_id+email)
    // — απλά ξαναενεργοποιείται αν είχε γίνει unsubscribe/notified.
    const { data: row, error: upsertError } = await supabase
      .from('waitlist')
      .upsert(
        {
          unit_id: unitId,
          email,
          name,
          phone,
          notified_at: null,
          unsubscribed: false,
        },
        { onConflict: 'unit_id,email' }
      )
      .select('id')
      .single();

    if (upsertError) throw upsertError;

    await sendConfirmationEmail({
      to: email,
      waitlistId: row.id,
      locationName: unit.location_name,
      unitLabel: unit.label,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Κάτι πήγε στραβά. Δοκιμάστε ξανά αργότερα.' }),
    };
  }
};
