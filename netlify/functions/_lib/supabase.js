const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

let client;

// Service-role client — τρέχει μόνο server-side (μέσα σε Netlify
// Functions), ποτέ δεν εκτίθεται στον browser. Bypass RLS σκόπιμα,
// γιατί οι functions είναι το μόνο σημείο εγγραφής/ανάγνωσης.
function getSupabase() {
  if (!client) {
    client = createClient(config.SUPABASE_URL(), config.SUPABASE_SERVICE_ROLE_KEY(), {
      auth: { persistSession: false },
    });
  }
  return client;
}

module.exports = { getSupabase };
