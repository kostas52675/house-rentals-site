const { Resend } = require('resend');
const config = require('./config');
const { signUnsubscribeToken } = require('./auth');

let client;
function getResend() {
  if (!client) client = new Resend(config.RESEND_API_KEY());
  return client;
}

function unsubscribeFooterHtml(waitlistId) {
  const token = signUnsubscribeToken(waitlistId);
  const url = `${config.SITE_URL()}/api/unsubscribe?token=${encodeURIComponent(token)}`;
  return `
    <p style="margin-top:32px;padding-top:16px;border-top:1px solid #ddd;font-size:12px;color:#888;">
      Λαμβάνετε αυτό το email επειδή εγγραφήκατε στη λίστα ενημέρωσης διαθεσιμότητας
      στο House Rentals. Αν δεν θέλετε άλλες ειδοποιήσεις για αυτό το διαμέρισμα,
      <a href="${url}" style="color:#888;">πατήστε εδώ για διαγραφή</a>.
    </p>`;
}

async function sendConfirmationEmail({ to, waitlistId, locationName, unitLabel }) {
  const resend = getResend();
  await resend.emails.send({
    from: config.RESEND_FROM_EMAIL(),
    to,
    subject: `Ευχαριστούμε για το ενδιαφέρον — ${locationName}`,
    html: `
      <div style="font-family:sans-serif;font-size:15px;color:#222;line-height:1.5;">
        <p>Σας ευχαριστούμε που ενδιαφερθήκατε για το διαμέρισμα${unitLabel ? ` (${unitLabel})` : ''}
        στην περιοχή <strong>${locationName}</strong>.</p>
        <p>Θα σας ενημερώσουμε αυτόματα με email μόλις ελευθερωθεί.</p>
        ${unsubscribeFooterHtml(waitlistId)}
      </div>`,
  });
}

async function sendAvailabilityEmail({ to, waitlistId, locationName, unitLabel }) {
  const resend = getResend();
  const phone = config.CONTACT_PHONE();
  const bookingUrl = config.CONTACT_BOOKING_URL();
  const contactLines = [
    phone ? `τηλεφωνήστε μας στο <strong>${phone}</strong>` : null,
    bookingUrl ? `<a href="${bookingUrl}">κλείστε ραντεβού online</a>` : null,
  ].filter(Boolean).join(' ή ');

  await resend.emails.send({
    from: config.RESEND_FROM_EMAIL(),
    to,
    subject: `Ελευθερώθηκε το διαμέρισμα στην περιοχή ${locationName}`,
    html: `
      <div style="font-family:sans-serif;font-size:15px;color:#222;line-height:1.5;">
        <p>Καλησπέρα,</p>
        <p>Το διαμέρισμα${unitLabel ? ` (${unitLabel})` : ''} στο οποίο ενδιαφερόσασταν,
        στην περιοχή <strong>${locationName}</strong>, έχει πλέον ελευθερωθεί.</p>
        ${contactLines ? `<p>Επικοινωνήστε μαζί μας — ${contactLines}.</p>` : ''}
        ${unsubscribeFooterHtml(waitlistId)}
      </div>`,
  });
}

module.exports = { sendConfirmationEmail, sendAvailabilityEmail };
