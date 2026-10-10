-- ============================================================
-- House Rentals — schema για waitlist / διαθεσιμότητα.
-- Τρέξε αυτό μία φορά στο Supabase SQL Editor (project > SQL Editor > New query).
-- Τα unit id's ("ilioupoli-1", "argyroupoli-2", ...) ταιριάζουν
-- 1-προς-1 με τα anchors που ήδη χρησιμοποιεί το js/houseSite.js
-- (id="${key}-${i+1}" σε κάθε unit-card), ώστε να μη χρειάζεται
-- ξεχωριστό mapping.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists units (
  id text primary key,
  location_key text not null,
  location_name text not null,
  label text not null,
  rented boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  unit_id text not null references units(id),
  email text not null,
  name text,
  phone text,
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  unsubscribed boolean not null default false,
  unique (unit_id, email)
);

create index if not exists waitlist_unit_id_idx on waitlist(unit_id);

-- Seed — αντιγράφει την τρέχουσα κατάσταση (rented) από το
-- js/houseSite.js. Πείραξέ το εδώ μόνο αν αλλάξει ο αριθμός
-- διαμερισμάτων ανά τοποθεσία· η κατάσταση rented/available μετά
-- το seed αλλάζει πάντα μέσα από το /pages/admin.html, όχι εδώ.
insert into units (id, location_key, location_name, label, rented) values
  ('ilioupoli-1',    'ilioupoli',    'Ηλιούπολη',    'Ισόγειο μπροστά, 40 τ.μ.',  true),
  ('ilioupoli-2',    'ilioupoli',    'Ηλιούπολη',    'Ισόγειο πίσω, 40 τ.μ.',     true),
  ('argyroupoli-1',  'argyroupoli',  'Αργυρούπολη',  '2ος Όροφος, 75 τ.μ.',       true),
  ('argyroupoli-2',  'argyroupoli',  'Αργυρούπολη',  '1ος Όροφος, 60 τ.μ.',       true),
  ('argyroupoli-3',  'argyroupoli',  'Αργυρούπολη',  'Ισόγειο, 55 τ.μ.',          true),
  ('argyroupoli-4',  'argyroupoli',  'Αργυρούπολη',  'Υπόγειο, 60 τ.μ.',          true),
  ('kormpi-1',       'kormpi',       'Κόρμπι',       'Ισόγειο, 35 τ.μ.',          true),
  ('kormpi-2',       'kormpi',       'Κόρμπι',       'Ισόγειο, 35 τ.μ.',          true),
  ('kormpi-3',       'kormpi',       'Κόρμπι',       'Υπόγειο, 32 τ.μ.',          true),
  ('kormpi-4',       'kormpi',       'Κόρμπι',       'Υπόγειο, 32 τ.μ.',          true),
  ('vyronas-1',      'vyronas',      'Βύρωνας',      'Διαμέρισμα 1, 42 τ.μ.',     true)
on conflict (id) do nothing;
