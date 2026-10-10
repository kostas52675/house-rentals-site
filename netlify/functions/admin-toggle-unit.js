const { getSupabase } = require('./_lib/supabase');
const { isValidSession } = require('./_lib/auth');
const { sendAvailabilityEmail } = require('./_lib/resend');
const { cleanText } = require('./_lib/validate');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  if (!isValidSession(event.headers.cookie)) {
    return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Μη έγκυρο αίτημα.' }) };
  }

  const unitId = cleanText(payload.unitId, 100);
  if (!unitId) {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Λείπει το unitId.' }) };
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
      return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Το διαμέρισμα δεν βρέθηκε.' }) };
    }

    const wasRented = unit.rented;
    const nowRented = !wasRented;

    const { error: updateError } = await supabase
      .from('units')
      .update({ rented: nowRented, updated_at: new Date().toISOString() })
      .eq('id', unitId);
    if (updateError) throw updateError;

    let notifiedCount = 0;

    // Μόλις ένα διαμέρισμα γίνεται διαθέσιμο (ήταν ενοικιασμένο,
    // τώρα δεν είναι), ενημερώνουμε όσους περιμένουν σε waitlist
    // και "αδειάζουμε" τη λίστα τους (notified_at) ώστε να μη
    // ξαναστείλουμε τα ίδια emails.
    if (wasRented && !nowRented) {
      const { data: waitlistRows, error: waitlistError } = await supabase
        .from('waitlist')
        .select('id, email')
        .eq('unit_id', unitId)
        .is('notified_at', null)
        .eq('unsubscribed', false);
      if (waitlistError) throw waitlistError;

      const results = await Promise.allSettled(
        (waitlistRows || []).map((row) =>
          sendAvailabilityEmail({
            to: row.email,
            waitlistId: row.id,
            locationName: unit.location_name,
            unitLabel: unit.label,
          }).then(() => row.id)
        )
      );

      const sentIds = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value);

      if (sentIds.length > 0) {
        const { error: markError } = await supabase
          .from('waitlist')
          .update({ notified_at: new Date().toISOString() })
          .in('id', sentIds);
        if (markError) throw markError;
      }

      notifiedCount = sentIds.length;
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, unitId, rented: nowRented, notifiedCount }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Κάτι πήγε στραβά. Δοκιμάστε ξανά αργότερα.' }),
    };
  }
};
