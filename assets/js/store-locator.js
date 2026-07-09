(function () {
  'use strict';

  var mapEl = document.getElementById('location-map');
  if (!mapEl || typeof L === 'undefined' || !window.ROWEM_STORES) return;

  var PRODUCT_LINKS = {
    'ROWEM Apparel': 'apparel.html',
    'Traps': 'critter-gitr.html',
    'Burr Paw': 'burr-paw.html'
  };

  var STORES = window.ROWEM_STORES;

  var searchInput = document.getElementById('location-search');
  var radiusSelect = document.getElementById('location-radius');
  var productSelect = document.getElementById('location-product');
  var resultsList = document.getElementById('location-results');
  var resultsCount = document.getElementById('location-results-count');
  var resultsStatus = document.getElementById('location-results-status');
  var searchForm = document.getElementById('location-search-form');

  var map = L.map(mapEl, {
    scrollWheelZoom: false,
    zoomControl: true
  }).setView([41.1, -96.4], 8);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18
  }).addTo(map);

  map.on('focus', function () {
    map.scrollWheelZoom.enable();
  });
  map.on('blur', function () {
    map.scrollWheelZoom.disable();
  });

  var markerLayer = L.layerGroup().addTo(map);
  var markersById = {};
  var activeId = null;
  var searchOrigin = null;
  var geocodeTimer = null;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function phoneHref(phone) {
    var digits = String(phone).replace(/\D/g, '');
    return digits ? 'tel:+1' + digits.replace(/^1/, '') : '';
  }

  function renderBadges(products, className) {
    if (!products || !products.length) return '';
    return products.map(function (product) {
      var href = PRODUCT_LINKS[product];
      var label = escapeHtml(product);
      if (href) {
        return '<a class="' + className + '" href="' + href + '">' + label + '</a>';
      }
      return '<span class="' + className + '">' + label + '</span>';
    }).join('');
  }

  function haversineMiles(lat1, lng1, lat2, lng2) {
    var toRad = function (deg) {
      return (deg * Math.PI) / 180;
    };
    var earthRadius = 3958.8;
    var dLat = toRad(lat2 - lat1);
    var dLng = toRad(lng2 - lng1);
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function matchesProduct(store, productFilter) {
    if (productFilter === 'all') return true;
    return store.products_carried && store.products_carried.indexOf(productFilter) !== -1;
  }

  function filterStores() {
    var productFilter = productSelect ? productSelect.value : 'all';
    var radius = radiusSelect ? parseFloat(radiusSelect.value) : 50;
    var filtered = STORES.filter(function (store) {
      return matchesProduct(store, productFilter);
    });

    if (searchOrigin) {
      filtered = filtered
        .map(function (store) {
          return {
            store: store,
            distance: haversineMiles(
              searchOrigin.lat,
              searchOrigin.lng,
              store.lat,
              store.lng
            )
          };
        })
        .filter(function (entry) {
          return entry.distance <= radius;
        })
        .sort(function (a, b) {
          return a.distance - b.distance;
        });
    } else {
      filtered = filtered
        .map(function (store) {
          return { store: store, distance: null };
        })
        .sort(function (a, b) {
          return a.store.store_name.localeCompare(b.store.store_name);
        });
    }

    return filtered;
  }

  function createMarkerIcon(isActive) {
    return L.divIcon({
      className: 'location-marker' + (isActive ? ' location-marker--active' : ''),
      html: '<span class="location-marker__pin" aria-hidden="true"></span>',
      iconSize: [28, 36],
      iconAnchor: [14, 36],
      popupAnchor: [0, -32]
    });
  }

  function buildPopup(store, distance) {
    var cityLine = escapeHtml(store.city) + ', ' + escapeHtml(store.state) + ' ' + escapeHtml(store.zip);
    var distanceHtml = distance !== null
      ? '<p class="location-popup__distance">' + distance.toFixed(1) + ' mi away</p>'
      : '';
    var phoneLink = phoneHref(store.phone);
    var phoneHtml = phoneLink
      ? '<a href="' + phoneLink + '">' + escapeHtml(store.phone) + '</a>'
      : escapeHtml(store.phone);

    return (
      '<div class="location-popup">' +
      '<p class="location-popup__label caps">Products carried</p>' +
      '<div class="location-popup__badges">' +
      renderBadges(store.products_carried, 'store-badge store-badge--sm') +
      '</div>' +
      '<strong class="location-popup__title">' + escapeHtml(store.store_name) + '</strong>' +
      '<p class="location-popup__address">' + escapeHtml(store.address) + '<br>' + cityLine + '</p>' +
      (store.phone ? '<p class="location-popup__phone">' + phoneHtml + '</p>' : '') +
      distanceHtml +
      '<a class="location-popup__link" href="' + escapeHtml(store.directions_url) + '" target="_blank" rel="noopener noreferrer">Get directions</a>' +
      '<p class="location-popup__note">Availability varies by store.</p>' +
      '</div>'
    );
  }

  function setActiveStore(id) {
    activeId = id;

    Object.keys(markersById).forEach(function (markerId) {
      var marker = markersById[markerId];
      marker.setIcon(createMarkerIcon(markerId === id));
    });

    if (!resultsList) return;

    resultsList.querySelectorAll('.location-card').forEach(function (card) {
      var isActive = card.dataset.storeId === id;
      card.classList.toggle('is-active', isActive);
      var details = card.querySelector('[data-store-details]');
      if (details) {
        details.hidden = !isActive;
      }
      if (isActive) {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  function updateMap(entries) {
    markerLayer.clearLayers();
    markersById = {};

    if (!entries.length) {
      if (searchOrigin) {
        map.setView([searchOrigin.lat, searchOrigin.lng], 10);
      }
      return;
    }

    var bounds = [];

    entries.forEach(function (entry) {
      var store = entry.store;
      var marker = L.marker([store.lat, store.lng], {
        icon: createMarkerIcon(store.id === activeId),
        title: store.store_name
      });

      marker.bindPopup(buildPopup(store, entry.distance));
      marker.on('click', function () {
        setActiveStore(store.id);
      });

      marker.addTo(markerLayer);
      markersById[store.id] = marker;
      bounds.push([store.lat, store.lng]);
    });

    if (searchOrigin) {
      bounds.push([searchOrigin.lat, searchOrigin.lng]);
    }

    if (bounds.length === 1) {
      map.setView(bounds[0], 13);
    } else {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 13 });
    }

    scheduleMapResize();
  }

  function renderStoreCard(entry) {
    var store = entry.store;
    var cityLine = escapeHtml(store.city) + ', ' + escapeHtml(store.state) + ' ' + escapeHtml(store.zip);
    var distanceBadge = entry.distance !== null
      ? '<span class="location-card__distance">' + entry.distance.toFixed(1) + ' mi</span>'
      : '';
    var phoneLink = phoneHref(store.phone);
    var phoneHtml = phoneLink
      ? '<a href="' + phoneLink + '">' + escapeHtml(store.phone) + '</a>'
      : escapeHtml(store.phone);
    var websiteHtml = store.website
      ? '<a href="' + escapeHtml(store.website) + '" target="_blank" rel="noopener noreferrer">Visit website</a>'
      : '';
    var isActive = store.id === activeId;

    return (
      '<article class="location-card' + (isActive ? ' is-active' : '') + '" data-store-id="' + escapeHtml(store.id) + '" tabindex="0" role="button" aria-expanded="' + (isActive ? 'true' : 'false') + '" aria-label="Show ' + escapeHtml(store.store_name) + ' on map">' +
      '<div class="location-card__head">' +
      '<p class="location-card__label caps">Retailer</p>' +
      distanceBadge +
      '</div>' +
      '<h3 class="location-card__title">' + escapeHtml(store.store_name) + '</h3>' +
      '<p class="location-card__address">' + escapeHtml(store.address) + ', ' + cityLine + '</p>' +
      '<div class="location-card__preview-badges" aria-hidden="true">' +
      renderBadges(store.products_carried, 'store-badge store-badge--sm') +
      '</div>' +
      '<div class="location-card__details" data-store-details' + (isActive ? '' : ' hidden') + '>' +
      '<p class="location-card__products-label caps">Products carried</p>' +
      '<div class="location-card__badges">' + renderBadges(store.products_carried, 'store-badge') + '</div>' +
      '<p class="location-card__disclaimer">Product selection varies by location. Contact the store to confirm availability.</p>' +
      '<ul class="location-card__contact">' +
      (store.phone ? '<li><strong>Phone:</strong> ' + phoneHtml + '</li>' : '') +
      (store.website ? '<li><strong>Web:</strong> ' + websiteHtml + '</li>' : '') +
      '</ul>' +
      '<div class="location-card__actions">' +
      '<a class="location-card__directions" href="' + escapeHtml(store.directions_url) + '" target="_blank" rel="noopener noreferrer">Get directions</a>' +
      '</div>' +
      '</div>' +
      '</article>'
    );
  }

  function renderResults(entries) {
    if (!resultsList) return;

    if (!entries.length) {
      resultsList.innerHTML =
        '<div class="location-empty">' +
        '<p><strong>No locations found</strong></p>' +
        '<p>Try a different city or zip code, expand your search radius, or change the product filter.</p>' +
        '</div>';
      if (resultsCount) resultsCount.textContent = '0 results';
      return;
    }

    resultsList.innerHTML = entries.map(renderStoreCard).join('');

    if (resultsCount) {
      resultsCount.textContent = entries.length + (entries.length === 1 ? ' result' : ' results');
    }

    resultsList.querySelectorAll('.location-card').forEach(function (card) {
      function activateCard() {
        var id = card.dataset.storeId;
        setActiveStore(id);
        var marker = markersById[id];
        if (marker) {
          marker.openPopup();
          map.panTo(marker.getLatLng(), { animate: true });
        }
      }

      card.addEventListener('click', function (event) {
        if (event.target.closest('a')) return;
        activateCard();
      });

      card.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activateCard();
        }
      });
    });
  }

  function setStatus(message, isError) {
    if (!resultsStatus) return;
    resultsStatus.textContent = message || '';
    resultsStatus.classList.toggle('is-error', Boolean(isError));
  }

  function geocodeQuery(query) {
    var trimmed = query.trim();
    if (!trimmed) {
      searchOrigin = null;
      setStatus('');
      refresh();
      return Promise.resolve();
    }

    setStatus('Searching near ' + trimmed + '…');

    var isZip = /^\d{5}(-\d{4})?$/.test(trimmed);
    var url = isZip
      ? 'https://nominatim.openstreetmap.org/search?postalcode=' +
        encodeURIComponent(trimmed.slice(0, 5)) +
        '&country=US&format=json&limit=1'
      : 'https://nominatim.openstreetmap.org/search?q=' +
        encodeURIComponent(trimmed + ', Nebraska, USA') +
        '&format=json&limit=1';

    return fetch(url, {
      headers: { Accept: 'application/json' }
    })
      .then(function (response) {
        if (!response.ok) throw new Error('Geocoding failed');
        return response.json();
      })
      .then(function (results) {
        if (!results.length) {
          searchOrigin = null;
          setStatus('We couldn\'t find that location. Try a nearby city or zip code.', true);
          refresh();
          return;
        }

        searchOrigin = {
          lat: parseFloat(results[0].lat),
          lng: parseFloat(results[0].lon),
          label: results[0].display_name
        };
        setStatus('Showing locations near your search.');
        refresh();
      })
      .catch(function () {
        searchOrigin = null;
        setStatus('Location search is temporarily unavailable. Browse all locations below.', true);
        refresh();
      });
  }

  function refresh() {
    var entries = filterStores();
    if (!activeId || !entries.some(function (entry) { return entry.store.id === activeId; })) {
      activeId = entries.length ? entries[0].store.id : null;
    }
    updateMap(entries);
    renderResults(entries);

    if (activeId && markersById[activeId]) {
      markersById[activeId].setIcon(createMarkerIcon(true));
    }
  }

  if (searchForm) {
    searchForm.addEventListener('submit', function (event) {
      event.preventDefault();
      geocodeQuery(searchInput ? searchInput.value : '');
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      clearTimeout(geocodeTimer);
      if (!searchInput.value.trim()) {
        searchOrigin = null;
        setStatus('');
        refresh();
        return;
      }
      geocodeTimer = setTimeout(function () {
        geocodeQuery(searchInput.value);
      }, 650);
    });
  }

  [radiusSelect, productSelect].forEach(function (control) {
    if (!control) return;
    control.addEventListener('change', refresh);
  });

  var resizeTimer;
  function scheduleMapResize() {
    requestAnimationFrame(function () {
      map.invalidateSize({ pan: false });
    });
  }

  window.addEventListener('resize', scheduleMapResize);

  window.addEventListener('scroll', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(scheduleMapResize, 120);
  }, { passive: true });

  if ('IntersectionObserver' in window) {
    var mapObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) scheduleMapResize();
      });
    }, { threshold: [0, 0.25, 0.5, 1] });
    mapObserver.observe(mapEl);
  }

  refresh();

  setTimeout(scheduleMapResize, 0);
  setTimeout(scheduleMapResize, 300);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(scheduleMapResize);
  }
})();
