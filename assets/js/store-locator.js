(function () {
  'use strict';

  var PRODUCT_LINKS = {
    'ROWEM Apparel': 'apparel.html',
    'Traps': 'critter-gitr.html',
    'Burr Paw': 'burr-paw.html'
  };

  var listEl = document.querySelector('[data-store-locator-list]');
  if (!listEl || !window.ROWEM_STORES) return;

  var filterRoot = document.querySelector('[data-store-locator-filters]');
  var emptyEl = document.querySelector('[data-store-locator-empty]');
  var activeFilter = 'all';

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

  function filteredStores() {
    if (activeFilter === 'all') return window.ROWEM_STORES.slice();
    return window.ROWEM_STORES.filter(function (store) {
      return store.products_carried && store.products_carried.indexOf(activeFilter) !== -1;
    });
  }

  function renderStoreCard(store, index) {
    var id = 'store-details-' + index;
    var cityLine = escapeHtml(store.city) + ', ' + escapeHtml(store.state) + ' ' + escapeHtml(store.zip);
    var addressLine = escapeHtml(store.address);
    var phoneLink = phoneHref(store.phone);
    var phoneHtml = phoneLink
      ? '<a href="' + phoneLink + '">' + escapeHtml(store.phone) + '</a>'
      : escapeHtml(store.phone);
    var websiteHtml = store.website
      ? '<a href="' + escapeHtml(store.website) + '" target="_blank" rel="noopener noreferrer">Visit website</a>'
      : '';
    var directionsHtml = store.directions_url
      ? '<a class="btn btn--solid btn--primary btn--small store-card__directions" href="' + escapeHtml(store.directions_url) + '" target="_blank" rel="noopener noreferrer"><span>Get Directions</span></a>'
      : '';

    return (
      '<article class="store-card" data-store-card>' +
        '<button class="store-card__toggle" type="button" aria-expanded="false" aria-controls="' + id + '" data-store-toggle>' +
          '<span class="store-card__summary">' +
            '<span class="store-card__heading">' +
              '<span class="store-card__name">' + escapeHtml(store.store_name) + '</span>' +
              '<span class="store-card__location">' + cityLine + '</span>' +
            '</span>' +
            '<span class="store-card__preview-badges" aria-hidden="true">' +
              renderBadges(store.products_carried, 'store-badge store-badge--sm') +
            '</span>' +
          '</span>' +
          '<svg class="store-card__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
            '<path stroke-linecap="round" d="M6 9l6 6 6-6"/>' +
          '</svg>' +
        '</button>' +
        '<div class="store-card__details" id="' + id + '" hidden data-store-details>' +
          '<div class="store-card__details-inner">' +
            '<p class="store-card__address">' + addressLine + '<br>' + cityLine + '</p>' +
            '<ul class="store-card__contact">' +
              (store.phone ? '<li><strong>Phone:</strong> ' + phoneHtml + '</li>' : '') +
              (store.website ? '<li><strong>Web:</strong> ' + websiteHtml + '</li>' : '') +
            '</ul>' +
            '<div class="store-card__products">' +
              '<p class="store-card__products-label caps">Products Carried</p>' +
              '<div class="store-card__badges">' + renderBadges(store.products_carried, 'store-badge') + '</div>' +
              '<p class="store-card__disclaimer">Product selection varies by location. Contact the store to confirm availability.</p>' +
            '</div>' +
            directionsHtml +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  function renderList() {
    var stores = filteredStores();
    listEl.innerHTML = stores.map(renderStoreCard).join('');
    if (emptyEl) {
      emptyEl.hidden = stores.length > 0;
    }
  }

  function closeAllExcept(exceptDetails) {
    listEl.querySelectorAll('[data-store-details]').forEach(function (panel) {
      if (panel === exceptDetails) return;
      panel.hidden = true;
      var toggle = panel.parentElement.querySelector('[data-store-toggle]');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
      panel.parentElement.classList.remove('is-open');
    });
  }

  listEl.addEventListener('click', function (e) {
    var toggle = e.target.closest('[data-store-toggle]');
    if (!toggle) return;

    var card = toggle.closest('[data-store-card]');
    var details = card.querySelector('[data-store-details]');
    var isOpen = toggle.getAttribute('aria-expanded') === 'true';

    if (isOpen) {
      toggle.setAttribute('aria-expanded', 'false');
      details.hidden = true;
      card.classList.remove('is-open');
      return;
    }

    closeAllExcept(details);
    toggle.setAttribute('aria-expanded', 'true');
    details.hidden = false;
    card.classList.add('is-open');
  });

  if (filterRoot) {
    filterRoot.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-store-filter]');
      if (!btn) return;
      activeFilter = btn.getAttribute('data-store-filter') || 'all';
      filterRoot.querySelectorAll('[data-store-filter]').forEach(function (filterBtn) {
        var isActive = filterBtn === btn;
        filterBtn.classList.toggle('is-active', isActive);
        filterBtn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
      renderList();
    });
  }

  renderList();
})();
