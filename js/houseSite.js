// ============================================================
// ΔΕΔΟΜΕΝΑ ΑΚΙΝΗΤΩΝ — μία πηγή αλήθειας για όλο το site.
// Κάθε τοποθεσία μπορεί να έχει πολλά διαμερίσματα (units).
// Home page, σελίδες τοποθεσιών και search/filters διαβάζουν
// όλα από εδώ, ώστε τα νούμερα να είναι πάντα συνεπή.
// ============================================================
const STOCK_PHOTOS = [
  '/assets/images/1000_resize052-min-e1680869637857.jpg',
  '/assets/images/Brand-New-Homes-for-Rent.webp',
  '/assets/images/R.jpeg',
];

const locations = {
  ilioupoli: {
    name: 'Ηλιούπολη',
    address: 'Ζακύνθου 15',
    photo: '/assets/images/front-photo1.webp',
    gallery: [STOCK_PHOTOS[0], STOCK_PHOTOS[1]],
    page: '/pages/ilioupoli.html',
    units: [
      { sqm: 40, price: 350, floor: 'Ισόγειο μπροστά', rented: true },
      { sqm: 40, price: 300, floor: 'Ισόγειο πίσω', rented: true },
    ],
  },
  argyroupoli: {
    name: 'Αργυρούπολη',
    address: 'Θήρας 98, ΤΚ 16451',
    photo: '/assets/images/argyroupoliHome.png',
    gallery: [STOCK_PHOTOS[1], STOCK_PHOTOS[2]],
    page: '/pages/argyroupoli.html',
    units: [
      { sqm: 75, price: 700, floor: '2ος Όροφος', rented: true },
      { sqm: 60, price: 600, floor: '1ος Όροφος', rented: true },
      { sqm: 55, price: 580, floor: 'Ισόγειο', rented: true },
      { sqm: 60, price: 500, floor: 'Υπόγειο', rented: true },
    ],
  },
  kormpi: {
    name: 'Κόρμπι',
    address: '25ης Μαρτίου 1-7, Βάρη, ΤΚ 16672',
    coords: { lat: 37.8346083, lng: 23.8202131 },
    photo: '/assets/images/kormpiHome.png',
    gallery: [STOCK_PHOTOS[2], STOCK_PHOTOS[0]],
    page: '/pages/kormpi.html',
    units: [
      { sqm: 35, price: 275, floor: 'Ισόγειο', rented: true },
      { sqm: 35, price: 255, floor: 'Ισόγειο', rented: true },
      { sqm: 32, price: 250, floor: 'Υπόγειο', rented: true },
      { sqm: 32, price: 250, floor: 'Υπόγειο', rented: true },
    ],
  },
  vyronas: {
    name: 'Βύρωνας',
    address: 'Μεσολογγίου 41, ΤΚ 16231',
    photo: '/assets/images/vyronasHome.png',
    gallery: [STOCK_PHOTOS[0], STOCK_PHOTOS[2]],
    page: '/pages/vyronas.html',
    units: [
      { sqm: 42, price: 400, floor: '', rented: true },
    ],
  },
};

// Flattened λίστα όλων των μονάδων (11 συνολικά), για search/filter.
const allUnits = Object.entries(locations).flatMap(([key, loc]) =>
  loc.units.map((u, i) => ({
    key,
    anchor: `${key}-${i + 1}`,
    name: loc.name,
    page: loc.page,
    photo: loc.photo,
    sqm: u.sqm,
    price: u.price,
    floor: u.floor,
    rented: !!u.rented,
  }))
);

// ============================================================
// LIVE STATUS OVERRIDES — το rented flag πιο πάνω είναι ο
// build-time προεπιλεγμένος πίνακας. Η πραγματική, τρέχουσα
// κατάσταση ζει στη βάση (Supabase) και αλλάζει από το admin
// panel χωρίς redeploy· εδώ τη φέρνουμε at runtime και την
// συγχωνεύουμε πάνω από τα στατικά δεδομένα. Αν το API δεν
// είναι διαθέσιμο (π.χ. τοπικό άνοιγμα του HTML χωρίς `netlify
// dev`), σιωπηλά κρατάμε τα στατικά rented flags.
let unitStatusOverridesPromise = null;
function getUnitStatusOverrides() {
  if (!unitStatusOverridesPromise) {
    unitStatusOverridesPromise = fetch('/api/units-status')
      .then((res) => (res.ok ? res.json() : { units: {} }))
      .then((data) => data.units || {})
      .catch(() => ({}));
  }
  return unitStatusOverridesPromise;
}

function unitsWithStatusOverrides(loc, key, overrides) {
  return loc.units.map((u, i) => {
    const anchor = `${key}-${i + 1}`;
    const hasOverride = Object.prototype.hasOwnProperty.call(overrides, anchor);
    return { ...u, rented: hasOverride ? !!overrides[anchor] : !!u.rented };
  });
}

// allUnits τροφοδοτεί το search/filter (πιο κάτω) — φτιάχτηκε
// συγχρονισμένα από τα στατικά δεδομένα, οπότε ενημερώνεται in
// place μόλις έρθει η πραγματική κατάσταση από το API.
getUnitStatusOverrides().then((overrides) => {
  allUnits.forEach((u) => {
    if (Object.prototype.hasOwnProperty.call(overrides, u.anchor)) {
      u.rented = !!overrides[u.anchor];
    }
  });
});

function minMax(nums) {
  return { min: Math.min(...nums), max: Math.max(...nums) };
}

function locationSummaryText(loc) {
  const { min: minPrice } = minMax(loc.units.map((u) => u.price));
  const { min: minSqm, max: maxSqm } = minMax(loc.units.map((u) => u.sqm));
  const sqmText = minSqm === maxSqm ? `${minSqm} τ.μ.` : `${minSqm}–${maxSqm} τ.μ.`;
  const unitText = loc.units.length === 1 ? '1 διαμέρισμα' : `${loc.units.length} διαμερίσματα`;
  return `${unitText} · ${sqmText} · από ${minPrice}€/μήνα`;
}

// ============================================================
// HOME PAGE — δυναμική δημιουργία της property-grid από τα
// locations, ώστε να μη χρειάζεται να ξαναγράφεται το HTML
// κάθε φορά που αλλάζουν τα διαμερίσματα.
// ============================================================
async function renderPropertyGrid() {
  const grid = document.getElementById('propertyGrid');
  if (!grid) return;

  const overrides = await getUnitStatusOverrides();

  grid.innerHTML = Object.entries(locations).map(([key, loc]) => {
    const units = unitsWithStatusOverrides(loc, key, overrides);
    const slides = [loc.photo, ...loc.gallery];
    const slidesHtml = slides
      .map((src, i) => `<div class="carousel-slide" style="background-image: url('${src}')" role="img" aria-label="${loc.name} - φωτογραφία ${i + 1}"></div>`)
      .join('');
    const availableCount = units.filter((u) => !u.rented).length;
    const statusBadge = availableCount === 0
      ? '<div class="property-status-badge">Ενοικιασμένα</div>'
      : (availableCount < loc.units.length
        ? `<div class="property-status-badge property-status-badge--available">${availableCount} διαθέσιμα</div>`
        : '');
    return `
      <article class="property-card">
        <div class="property-carousel">
          <div class="carousel-track">${slidesHtml}</div>
          <button type="button" class="carousel-arrow carousel-prev" aria-label="Προηγούμενη φωτογραφία">‹</button>
          <button type="button" class="carousel-arrow carousel-next" aria-label="Επόμενη φωτογραφία">›</button>
          <div class="carousel-dots"></div>
          ${statusBadge}
        </div>
        <div class="property-info">
          <h3>${loc.name}</h3>
          <p class="property-specs">${locationSummaryText(loc)}</p>
          <button type="button" class="property-cta" data-href="${loc.page}">Δείτε Όλα</button>
        </div>
      </article>`;
  }).join('');

  initCarousels();
}

// Property card carousel — swipe (native scroll-snap), βελάκια,
// dots. Δουλεύει με ίδιο τρόπο σε mouse και touch, χωρίς custom
// gesture code, γι' αυτό είναι αξιόπιστο σε κινητά.
function initCarousels() {
  document.querySelectorAll('.property-card').forEach((card) => {
    const track = card.querySelector('.carousel-track');
    const slides = Array.from(track.children);
    const dotsContainer = card.querySelector('.carousel-dots');
    const prevBtn = card.querySelector('.carousel-prev');
    const nextBtn = card.querySelector('.carousel-next');

    dotsContainer.innerHTML = '';
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Φωτογραφία ${i + 1}`);
      dot.addEventListener('click', () => {
        track.scrollTo({ left: track.clientWidth * i, behavior: 'smooth' });
      });
      dotsContainer.appendChild(dot);
    });
    const dots = Array.from(dotsContainer.children);

    function updateActiveDot() {
      const index = Math.round(track.scrollLeft / track.clientWidth);
      dots.forEach((d, i) => d.classList.toggle('active', i === index));
    }
    track.addEventListener('scroll', updateActiveDot);

    prevBtn.addEventListener('click', () => {
      const currentIndex = Math.round(track.scrollLeft / track.clientWidth);
      const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
      track.scrollTo({ left: track.clientWidth * prevIndex, behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', () => {
      const currentIndex = Math.round(track.scrollLeft / track.clientWidth);
      const nextIndex = (currentIndex + 1) % slides.length;
      track.scrollTo({ left: track.clientWidth * nextIndex, behavior: 'smooth' });
    });

    const cta = card.querySelector('.property-cta');
    if (cta) {
      cta.addEventListener('click', () => {
        window.location.href = cta.dataset.href;
      });
    }
  });
}

// ============================================================
// ΣΕΛΙΔΕΣ ΤΟΠΟΘΕΣΙΑΣ — <body data-location="kormpi"> λέει στο
// script ποια τοποθεσία να αποδώσει. Ίδια συνάρτηση για όλες
// τις σελίδες (ilioupoli/argyroupoli/kormpi/vyronas), άρα τα
// νούμερα προέρχονται πάντα από το ίδιο σημείο.
// ============================================================
async function renderLocationPage(key) {
  const loc = locations[key];
  if (!loc) return;

  const overrides = await getUnitStatusOverrides();
  const liveUnits = unitsWithStatusOverrides(loc, key, overrides);

  document.title = `${loc.name} - House Rentals`;

  const heroPhoto = document.querySelector('.location-hero-photo');
  if (heroPhoto) {
    heroPhoto.style.backgroundImage = `url('${loc.photo}')`;
    heroPhoto.setAttribute('role', 'img');
    heroPhoto.setAttribute('aria-label', `Κτίριο διαμερισμάτων στην περιοχή ${loc.name}`);
  }

  const nameEl = document.getElementById('locationName');
  if (nameEl) nameEl.textContent = loc.name;

  const addrEl = document.getElementById('locationAddress');
  if (addrEl) addrEl.textContent = `📍 ${loc.address ? loc.address + ', ' : ''}Αθήνα`;

  const summaryEl = document.getElementById('locationSummary');
  if (summaryEl) summaryEl.textContent = locationSummaryText(loc);

  const grid = document.getElementById('unitsGrid');
  if (grid) {
    const bestIndex = liveUnits.length > 1
      ? liveUnits.reduce((bestI, u, i, arr) => (
          (u.price / u.sqm) < (arr[bestI].price / arr[bestI].sqm) ? i : bestI
        ), 0)
      : -1;

    grid.innerHTML = liveUnits.map((u, i) => {
      const pricePerSqm = (u.price / u.sqm).toFixed(2);
      const isBest = i === bestIndex && !u.rented;
      const floorLabel = u.floor || `Διαμέρισμα ${i + 1}`;
      const badge = u.rented
        ? '<div class="unit-best-badge unit-best-badge--rented">Ενοικιασμένο</div>'
        : (isBest ? '<div class="unit-best-badge">🏆 Καλύτερη τιμή/τ.μ.</div>' : '');
      const unitAnchor = `${key}-${i + 1}`;
      const unitLabelText = `${floorLabel}, ${u.sqm} τ.μ.`;
      const cta = u.rented
        ? `<button type="button" class="unit-cta unit-cta--waitlist" data-waitlist-unit="${unitAnchor}" data-location-name="${loc.name}" data-unit-label="${unitLabelText}">Ενημέρωση όταν ελευθερωθεί</button>`
        : `<a class="unit-cta" href="mailto:konstantinosdimopoulos4@gmail.com?subject=${encodeURIComponent(`Ενδιαφέρομαι για διαμέρισμα ${u.sqm}τ.μ. στην περιοχή ${loc.name} (${floorLabel})`)}">Ρωτήστε για αυτό</a>`;
      return `
        <article class="unit-card${isBest ? ' unit-card--best' : ''}${u.rented ? ' unit-card--rented' : ''}" id="${unitAnchor}">
          ${badge}
          <div class="unit-thumb" style="background-image: url('${loc.photo}')" aria-hidden="true"></div>
          <div class="unit-body">
            <h3 class="unit-floor">${floorLabel}</h3>
            <div class="unit-stats">
              <div class="unit-stat">
                <span class="unit-stat-value">${u.sqm}</span>
                <span class="unit-stat-label">τ.μ.</span>
              </div>
              <div class="unit-stat">
                <span class="unit-stat-value">${u.price}€</span>
                <span class="unit-stat-label">/μήνα</span>
              </div>
              <div class="unit-stat">
                <span class="unit-stat-value">${pricePerSqm}€</span>
                <span class="unit-stat-label">/τ.μ.</span>
              </div>
            </div>
            ${cta}
          </div>
        </article>`;
    }).join('');
  }

  const mapEl = document.getElementById('locationMap');
  if (mapEl) {
    if (loc.coords) {
      mapEl.src = `https://www.google.com/maps?q=${loc.coords.lat},${loc.coords.lng}&z=17&output=embed`;
    } else {
      const query = encodeURIComponent(`${loc.address ? loc.address + ', ' : ''}${loc.name}, Αθήνα`);
      mapEl.src = `https://www.google.com/maps?q=${query}&output=embed`;
    }
  }

  injectListingSchema(loc, key, liveUnits);
}

// schema.org RealEstateListing ανά διαμέρισμα (JSON-LD), ώστε οι
// μηχανές αναζήτησης να καταλαβαίνουν τα δεδομένα κάθε μονάδας
// (τιμή, τ.μ., διεύθυνση, διαθεσιμότητα). Ένα ItemList ανά σελίδα
// τοποθεσίας, με ένα RealEstateListing per unit.
function injectListingSchema(loc, key, units) {
  const existing = document.getElementById('listingSchema');
  if (existing) existing.remove();

  const itemListElement = units.map((u, i) => {
    const anchor = `${key}-${i + 1}`;
    const floorLabel = u.floor || `Διαμέρισμα ${i + 1}`;
    return {
      '@type': 'RealEstateListing',
      name: `${floorLabel} - ${u.sqm}τ.μ. στην περιοχή ${loc.name}`,
      description: `Διαμέρισμα ${u.sqm}τ.μ. προς ενοικίαση στην περιοχή ${loc.name}${loc.address ? ', ' + loc.address : ''}.`,
      url: `${window.location.origin}${loc.page}#${anchor}`,
      image: `${window.location.origin}${loc.photo}`,
      address: {
        '@type': 'PostalAddress',
        streetAddress: loc.address || loc.name,
        addressLocality: 'Αθήνα',
        addressCountry: 'GR',
      },
      floorSize: {
        '@type': 'QuantitativeValue',
        value: u.sqm,
        unitCode: 'MTK',
      },
      offers: {
        '@type': 'Offer',
        price: u.price,
        priceCurrency: 'EUR',
        availability: u.rented ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      },
    };
  });

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'listingSchema';
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement,
  });
  document.head.appendChild(script);
}

// ============================================================
// SEARCH / FILTERS — λειτουργούν πάνω στη flattened λίστα
// μονάδων (allUnits), όχι ανά τοποθεσία, ώστε κάθε διαμέρισμα
// να είναι ξεχωριστά αναζητήσιμο/φιλτραρίσιμο.
// ============================================================
const input = document.getElementById('searchbar');

if (input) {
  const list = document.getElementById('list');
  const searchForm = input.closest('form');
  const filterToggle = document.getElementById('filterToggle');
  const filterPanel = document.getElementById('filterPanel');
  const maxPriceInput = document.getElementById('maxPrice');
  const minSqmInput = document.getElementById('minSqm');
  const searchContainer = document.querySelector('.search-container');
  const searchSubmit = document.getElementById('searchSubmit');

  function getFilteredUnits(query) {
    const q = query.trim().toLowerCase();
    const maxPrice = parseFloat(maxPriceInput.value) || Infinity;
    const minSqm = parseFloat(minSqmInput.value) || 0;

    return allUnits.filter((u) =>
      (q === '' || u.name.toLowerCase().includes(q)) &&
      u.price <= maxPrice &&
      u.sqm >= minSqm
    );
  }

  function renderList(items) {
    list.innerHTML = '';
    if (items.length === 0) {
      const li = document.createElement('li');
      li.className = 'result-empty';
      li.textContent = 'Δεν βρέθηκαν αποτελέσματα';
      list.appendChild(li);
      return;
    }
    items.forEach((u) => {
      const li = document.createElement('li');
      li.className = 'result-card';
      const floorText = u.floor ? ` · ${u.floor}` : '';
      const statusTag = u.rented
        ? '<span class="result-status result-status--rented">Ενοικιασμένο</span>'
        : '<span class="result-status result-status--available">Διαθέσιμο</span>';
      li.innerHTML = `
        <div class="result-thumb" style="background-image: url('${u.photo}')" aria-hidden="true"></div>
        <div class="result-info">
          <div class="result-top">
            <span class="result-area">${u.name}</span>
            ${statusTag}
          </div>
          <div class="result-price">${u.price}€<span>/μήνα</span></div>
          <div class="result-meta">${u.sqm} τ.μ.${floorText}</div>
        </div>
        <span class="result-cta">Δες περισσότερα →</span>`;
      li.addEventListener('click', () => {
        window.location.href = `${u.page}#${u.anchor}`;
      });
      list.appendChild(li);
    });
  }

  function runSearch() {
    const matches = getFilteredUnits(input.value);
    renderList(matches);
    list.style.display = 'block';
  }

  input.addEventListener('keyup', runSearch);
  input.addEventListener('focus', runSearch);
  input.addEventListener('blur', () => {
    setTimeout(() => { list.style.display = 'none'; }, 150);
  });
  // Το mousedown μέσα στη λίστα κάνει blur στο input ΠΡΙΝ καν
  // ολοκληρωθεί το click στο αποτέλεσμα (race condition — γι'
  // αυτό το κλικ "δεν άνοιγε" τη σελίδα). Το preventDefault εδώ
  // εμποδίζει το blur να συμβεί καθόλου για clicks μέσα στη λίστα.
  list.addEventListener('mousedown', (e) => {
    e.preventDefault();
  });

  filterToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    filterPanel.style.display = (filterPanel.style.display === 'flex') ? 'none' : 'flex';
    searchContainer.classList.toggle('is-open', filterPanel.style.display === 'flex');
    list.style.display = 'none';
    searchContainer.classList.remove('is-open');
  });

  document.getElementById('applyFilters').addEventListener('click', () => {
    filterPanel.style.display = 'none';
    searchContainer.classList.toggle('is-open', filterPanel.style.display === 'flex');
    runSearch();
    searchContainer.classList.add('is-open');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      list.style.display = 'none';
      filterPanel.style.display = 'none';
    }
  });

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const matches = getFilteredUnits(input.value);
    if (matches.length > 0) {
      window.location.href = `${matches[0].page}#${matches[0].anchor}`;
    }
    list.style.display = 'none';
  });

  searchContainer.addEventListener('click', (e) => {
    const insideFilterArea = e.target === filterToggle || filterToggle.contains(e.target) || filterPanel.contains(e.target);
    if (!insideFilterArea && filterPanel.style.display === 'flex') {
      filterPanel.style.display = 'none';
      searchContainer.classList.remove('is-open');
    }
  });

  searchSubmit.addEventListener('click', () => {
    const matches = getFilteredUnits(input.value);
    if (matches.length > 0) {
      window.location.href = `${matches[0].page}#${matches[0].anchor}`;
    }
    list.style.display = 'none';
    searchContainer.classList.remove('is-open');
  });
}

const heroVideo = document.querySelector('.hero-video');
const isMobileDevice = window.matchMedia('(max-width: 768px)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

if (heroVideo) {
  if (isMobileDevice) {
    heroVideo.pause();
    heroVideo.removeAttribute('autoplay');
    heroVideo.style.display = 'none';
    heroVideo.closest('.hero-image')?.classList.add('mobile-fallback');
  } else {
    heroVideo.muted = true;
    heroVideo.playsInline = true;
    heroVideo.setAttribute('playsinline', 'true');
    heroVideo.setAttribute('webkit-playsinline', 'true');

    // Μία και μόνη πηγή αλήθειας για το αν το hero φαίνεται: το
    // IntersectionObserver (ελαφρύ, τρέχει εκτός main thread). Πριν υπήρχαν
    // ΚΑΙ listeners σε scroll/wheel/touchmove/pointerdown/resize που σε κάθε
    // scroll-frame ξανάκαναν getBoundingClientRect + play(), και μάλωναν με
    // το observer (ένα play/pause "tug of war" σε κάθε scroll) — με 4K
    // (3840x2160) βίντεο αυτό προκαλούσε αισθητό lag στο laptop.
    let heroIsVisible = true;

    const forceResumeHeroVideo = () => {
      if (!heroVideo || !heroIsVisible) return;

      heroVideo.muted = true;
      if (heroVideo.paused) {
        heroVideo.currentTime = Math.max(0, heroVideo.currentTime || 0);
        heroVideo.play().catch(() => {
          setTimeout(() => {
            if (heroIsVisible && heroVideo.paused) {
              heroVideo.play().catch(() => {});
            }
          }, 250);
        });
      }
    };

    const pauseHeroVideo = () => {
      heroVideo.pause();
    };

    heroVideo.addEventListener('pause', () => {
      if (heroIsVisible) {
        setTimeout(forceResumeHeroVideo, 200);
      }
    });

    if ('IntersectionObserver' in window) {
      const videoObserver = new IntersectionObserver(([entry]) => {
        heroIsVisible = entry.isIntersecting;
        if (heroIsVisible) {
          forceResumeHeroVideo();
        } else {
          pauseHeroVideo();
        }
      }, { threshold: 0.2 });
      videoObserver.observe(heroVideo);
    } else {
      forceResumeHeroVideo();
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        pauseHeroVideo();
        return;
      }
      forceResumeHeroVideo();
    });

    window.addEventListener('focus', forceResumeHeroVideo);
  }
}

// ============================================================
// WAITLIST MODAL — ένα μοναδικό modal στο DOM, ξαναχρησιμοποιείται
// για όποιο ενοικιασμένο διαμέρισμα πατηθεί το "Ενημέρωση όταν
// ελευθερωθεί" (data-waitlist-unit). Submit -> POST στο Netlify
// Function /api/waitlist-signup, το οποίο αποθηκεύει το email
// στη βάση και στέλνει αυτόματο email επιβεβαίωσης.
// ============================================================
let waitlistModalEl = null;

function ensureWaitlistModal() {
  if (waitlistModalEl) return waitlistModalEl;

  const overlay = document.createElement('div');
  overlay.className = 'waitlist-modal-overlay';
  overlay.innerHTML = `
    <div class="waitlist-modal" role="dialog" aria-modal="true" aria-labelledby="waitlistModalTitle">
      <button type="button" class="waitlist-modal-close" aria-label="Κλείσιμο">×</button>
      <h3 id="waitlistModalTitle">Ενημέρωσέ με όταν ελευθερωθεί</h3>
      <p class="waitlist-modal-subtitle"></p>
      <form class="waitlist-form">
        <p class="waitlist-hidden-field" aria-hidden="true">
          <label>Μην το συμπληρώσετε: <input name="botField" tabindex="-1" autocomplete="off"></label>
        </p>
        <label for="waitlistEmail">Email *</label>
        <input type="email" id="waitlistEmail" name="email" required autocomplete="email">
        <label for="waitlistName">Όνομα (προαιρετικό)</label>
        <input type="text" id="waitlistName" name="name" autocomplete="name">
        <label for="waitlistPhone">Τηλέφωνο (προαιρετικό)</label>
        <input type="tel" id="waitlistPhone" name="phone" autocomplete="tel">
        <button type="submit" class="waitlist-submit">Εγγραφή στη λίστα ενημέρωσης</button>
        <p class="waitlist-form-message" role="status"></p>
      </form>
    </div>`;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeWaitlistModal();
  });
  overlay.querySelector('.waitlist-modal-close').addEventListener('click', closeWaitlistModal);

  const form = overlay.querySelector('.waitlist-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const messageEl = form.querySelector('.waitlist-form-message');
    const submitBtn = form.querySelector('.waitlist-submit');

    messageEl.textContent = '';
    messageEl.className = 'waitlist-form-message';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Αποστολή...';

    try {
      const res = await fetch('/api/waitlist-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId: form.dataset.unitId,
          email: form.email.value,
          name: form.name.value,
          phone: form.phone.value,
          botField: form.botField.value,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Κάτι πήγε στραβά.');

      form.reset();
      messageEl.textContent = 'Ευχαριστούμε! Θα σας ενημερώσουμε μόλις ελευθερωθεί — ελέγξτε το email σας για επιβεβαίωση.';
      messageEl.classList.add('waitlist-form-message--success');
      submitBtn.textContent = 'Έτοιμο ✓';
      setTimeout(closeWaitlistModal, 3000);
    } catch (err) {
      messageEl.textContent = err.message || 'Κάτι πήγε στραβά. Δοκιμάστε ξανά.';
      messageEl.classList.add('waitlist-form-message--error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Εγγραφή στη λίστα ενημέρωσης';
    }
  });

  waitlistModalEl = overlay;
  return overlay;
}

function openWaitlistModal({ unitId, locationName, unitLabel }) {
  const overlay = ensureWaitlistModal();
  const form = overlay.querySelector('.waitlist-form');
  form.reset();
  form.dataset.unitId = unitId;

  const submitBtn = form.querySelector('.waitlist-submit');
  submitBtn.disabled = false;
  submitBtn.textContent = 'Εγγραφή στη λίστα ενημέρωσης';

  const messageEl = form.querySelector('.waitlist-form-message');
  messageEl.textContent = '';
  messageEl.className = 'waitlist-form-message';

  overlay.querySelector('.waitlist-modal-subtitle').textContent =
    `${unitLabel ? unitLabel + ' — ' : ''}${locationName}`;

  overlay.classList.add('is-open');
  document.body.classList.add('waitlist-modal-open');
  overlay.querySelector('#waitlistEmail').focus();
}

function closeWaitlistModal() {
  if (!waitlistModalEl) return;
  waitlistModalEl.classList.remove('is-open');
  document.body.classList.remove('waitlist-modal-open');
}

document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-waitlist-unit]');
  if (!trigger) return;
  openWaitlistModal({
    unitId: trigger.dataset.waitlistUnit,
    locationName: trigger.dataset.locationName,
    unitLabel: trigger.dataset.unitLabel,
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeWaitlistModal();
});

renderPropertyGrid();

const pageLocation = document.body.dataset.location;
if (pageLocation) renderLocationPage(pageLocation);
