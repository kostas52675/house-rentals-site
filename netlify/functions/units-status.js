const { getSupabase } = require('./_lib/supabase');

// Public, χωρίς auth — το διαβάζει κάθε επισκέπτης του site για να
// αποφασίσει αν ένα διαμέρισμα είναι ενοικιασμένο ή διαθέσιμο.
exports.handler = async () => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('units').select('id, rented');
    if (error) throw error;

    const statusById = {};
    (data || []).forEach((row) => {
      statusById[row.id] = row.rented;
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ units: statusById }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Δεν ήταν δυνατή η ανάκτηση της κατάστασης διαμερισμάτων.' }),
    };
  }
};
