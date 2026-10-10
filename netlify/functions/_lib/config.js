// Μία πηγή αλήθειας για στοιχεία επικοινωνίας/site, ώστε να μην
// είναι hardcoded σε κάθε function ξεχωριστά.
function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

module.exports = {
  SUPABASE_URL: () => required('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: () => required('SUPABASE_SERVICE_ROLE_KEY'),
  RESEND_API_KEY: () => required('RESEND_API_KEY'),
  RESEND_FROM_EMAIL: () => process.env.RESEND_FROM_EMAIL || 'House Rentals <onboarding@resend.dev>',
  ADMIN_PASSWORD: () => required('ADMIN_PASSWORD'),
  ADMIN_SESSION_SECRET: () => required('ADMIN_SESSION_SECRET'),
  UNSUBSCRIBE_SECRET: () => required('UNSUBSCRIBE_SECRET'),
  SITE_URL: () => (process.env.SITE_URL || '').replace(/\/$/, ''),
  CONTACT_PHONE: () => process.env.CONTACT_PHONE || '',
  CONTACT_EMAIL: () => process.env.CONTACT_EMAIL || '',
  CONTACT_BOOKING_URL: () => process.env.CONTACT_BOOKING_URL || '',
};
