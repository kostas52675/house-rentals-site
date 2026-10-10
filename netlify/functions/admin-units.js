const { getSupabase } = require('./_lib/supabase');
const { isValidSession } = require('./_lib/auth');

exports.handler = async (event) => {
  if (!isValidSession(event.headers.cookie)) {
    return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const supabase = getSupabase();
    const { data: units, error: unitsError } = await supabase
      .from('units')
      .select('id, location_key, location_name, label, rented, updated_at')
      .order('location_key')
      .order('id');
    if (unitsError) throw unitsError;

    const { data: waitlistRows, error: waitlistError } = await supabase
      .from('waitlist')
      .select('unit_id')
      .is('notified_at', null)
      .eq('unsubscribed', false);
    if (waitlistError) throw waitlistError;

    const counts = {};
    (waitlistRows || []).forEach((row) => {
      counts[row.unit_id] = (counts[row.unit_id] || 0) + 1;
    });

    const result = (units || []).map((u) => ({ ...u, waitlistCount: counts[u.id] || 0 }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ units: result }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Δεν ήταν δυνατή η ανάκτηση των διαμερισμάτων.' }),
    };
  }
};
