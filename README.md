# House Rentals

A website for apartment rentals in Athens, Greece (Ilioupoli, Argyroupoli, Kormpi, Vyronas). Visitors browse apartments by area with price, size and availability. If an apartment is rented, they can join a waitlist and get an email when it becomes available. The owner switches availability on and off from a simple admin panel.

> **Work in progress:** this project is still being built. See [Next steps](#work-in-progress--next-steps).

The site content (UI text, emails) is in Greek.

## Tech stack

- **Frontend:** static HTML / CSS / vanilla JavaScript (no framework, no build step)
- **Backend:** [Netlify Functions](https://docs.netlify.com/functions/overview/) (Node.js, bundled with esbuild)
- **Database:** [Supabase](https://supabase.com/) (Postgres) via `@supabase/supabase-js`
- **Email:** [Resend](https://resend.com/)
- **Contact form:** Netlify Forms
- **Hosting:** Netlify

## Project structure

```
index.html               Home page: areas, search and filters (price / size)
pages/                   Area pages, About, Services, Contact, Admin
thank-you.html           Shown after the contact form is submitted
css/houseSite.css        Styles
js/houseSite.js          Apartment data, rendering, filters, waitlist form
js/admin.js              Admin panel (login, unit list, availability toggle)
netlify/functions/       API endpoints (served under /api/*)
  _lib/                  Config, auth (HMAC cookies/tokens), Supabase, Resend, validation, rate limiting
supabase/schema.sql      Tables (units, waitlist) and seed data
netlify.toml             Build settings, redirects (/api/* → functions), security headers
```

### API endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/units-status` | GET | none | Current availability of all apartments |
| `/api/waitlist-signup` | POST | none | Join an apartment's waitlist. Sends a confirmation email |
| `/api/unsubscribe?token=…` | GET | signed token | Leave the waitlist |
| `/api/admin-login` | POST | password | Sets an HttpOnly session cookie (12 hours) |
| `/api/admin-logout` | POST | none | Clears the session cookie |
| `/api/admin-units` | GET | session | Apartment list for the admin panel |
| `/api/admin-toggle-unit` | POST | session | Toggle rented/available. When an apartment becomes available, emails everyone on its waitlist |

## Running locally

You need Node.js 18+, the [Netlify CLI](https://docs.netlify.com/cli/get-started/), and Supabase and Resend accounts (free tiers are enough).

1. **Install**
   ```bash
   npm install
   npm install -g netlify-cli
   ```
2. **Database:** in Supabase, open **SQL Editor → New query**, paste `supabase/schema.sql` and run it.
3. **Environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in the values in `.env`. Each variable is explained in the file's comments. `ADMIN_SESSION_SECRET` and `UNSUBSCRIBE_SECRET` should be two **different** random strings, for example:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
4. **Start**
   ```bash
   npm run dev
   ```
   `netlify dev` serves the site and the functions together, usually at http://localhost:8888. The admin panel is at `/pages/admin.html`.

If the environment variables are missing or the database is unreachable, the site still loads. It falls back to the static availability defined in `js/houseSite.js`.

### Deploying

Connect the repo to Netlify. Build settings are read from `netlify.toml`. Add the same variables from `.env` under **Site settings → Environment variables**, and set `SITE_URL` to your real domain.

## What works

- Home page with a video hero, area cards, search and filters (max price, min size)
- One page per area with apartment cards (size, price, floor) and "Rented" / "Best price" badges
- Live availability from the database, with a static fallback when the API is unavailable
- Per-apartment waitlist with a confirmation email and an unsubscribe link
- Password-protected admin panel: toggle availability, and everyone on the waitlist is notified automatically when an apartment becomes available
- Contact form via Netlify Forms, with a thank-you page
- Security basics: HMAC-signed session cookies and unsubscribe tokens, constant-time comparisons, honeypot field, simple rate limiting, `unique(unit_id, email)` constraint, security headers

## Work in progress / Next steps

- [ ] **Move apartment data into the database:** prices, sizes and floors are hardcoded in `js/houseSite.js` and duplicated in the `schema.sql` seed. Only availability comes from the database.
- [ ] **Edit from the admin panel:** change prices, add or remove apartments, view waitlists.
- [ ] **Stronger spam protection:** add a CAPTCHA (e.g. Cloudflare Turnstile or hCaptcha). The current rate limiter is in memory and resets on every cold start.
- [ ] **Admin auth:** currently a single shared password in an env var. Multiple admins would need real auth (e.g. Supabase Auth).
- [ ] **Photos per apartment** and an image gallery.
- [ ] **Verified sender domain in Resend**, so emails are not sent from `onboarding@resend.dev`.
- [ ] Consistent UI language (currently mixed Greek/English), an accessibility pass, and SEO meta tags.
- [ ] Tests for the Netlify Functions.
