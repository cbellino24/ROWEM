/**
 * ROWEM product page — renders product.html from catalog data
 */
(function () {
  'use strict';

  var page = document.querySelector('[data-product-page]');
  if (!page || !window.ROWEM_PRODUCTS) return;

  var params = new URLSearchParams(window.location.search);
  var productId = params.get('id');
  var product = productId ? window.ROWEM_PRODUCTS[productId] : null;

  if (!product) {
    page.innerHTML = '<div class="wrapper product-page__inner"><div class="product-not-found"><h1>Product not found</h1><p>Sorry, we could not find that product.</p><a href="index.html" class="btn btn--solid btn--primary">Back to home</a></div></div>';
    document.title = 'Product not found | ROWEM';
    return;
  }

  var breadcrumbEl = document.querySelector('[data-product-breadcrumb]');
  var mainImageEl = document.querySelector('[data-product-main-image]');
  var galleryMainEl = document.querySelector('[data-product-gallery-main]');
  var thumbsEl = document.querySelector('[data-product-thumbs]');
  var categoryEl = document.querySelector('[data-product-category]');
  var titleEl = document.querySelector('[data-product-title]');
  var priceEl = document.querySelector('[data-product-price]');
  var quoteEl = document.querySelector('[data-product-quote]');
  var excerptEl = document.querySelector('[data-product-excerpt]');
  var taxonomyEl = document.querySelector('[data-product-taxonomy]');
  var variantsEl = document.querySelector('[data-product-variants]');
  var actionsEl = document.querySelector('[data-product-actions]');
  var quantityEl = document.querySelector('[data-product-quantity]');
  var ctaEl = document.querySelector('[data-product-cta]');
  var formEl = document.querySelector('[data-product-form]');
  var descPanel = document.querySelector('[data-product-panel="description"]');
  var detailsPanel = document.querySelector('[data-product-panel="details"]');
  var relatedSection = document.querySelector('[data-product-related-section]');
  var relatedGrid = document.querySelector('[data-product-related]');

  function formatPrice(amount) {
    return '$' + amount.toFixed(2);
  }

  function setMeta() {
    document.title = product.title + ' | ROWEM';
    var desc = product.excerpt || product.title;
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', product.title + ' | ROWEM');
    var ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', desc);
    if (product.images && product.images[0]) {
      var ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) ogImage.setAttribute('content', 'https://rowem.com/' + product.images[0].src);
    }
  }

  function renderBreadcrumb() {
    if (!breadcrumbEl) return;
    breadcrumbEl.innerHTML =
      '<a href="index.html">Home</a>' +
      '<span class="collection-breadcrumb__sep" aria-hidden="true">/</span>' +
      '<a href="' + product.collectionUrl + '">' + product.collectionLabel + '</a>' +
      '<span class="collection-breadcrumb__sep" aria-hidden="true">/</span>' +
      '<span aria-current="page">' + product.title + '</span>';
  }

  function initGalleryZoom() {
    if (!galleryMainEl || !mainImageEl) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var zoomScale = 2.25;

    function resetZoom() {
      mainImageEl.style.transform = '';
      mainImageEl.style.transformOrigin = '';
      galleryMainEl.classList.remove('is-zooming');
    }

    galleryMainEl.addEventListener('mousemove', function (e) {
      var rect = galleryMainEl.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * 100;
      var y = ((e.clientY - rect.top) / rect.height) * 100;
      x = Math.max(0, Math.min(100, x));
      y = Math.max(0, Math.min(100, y));
      if (galleryMainEl.classList.contains('product-gallery__main--contain')) {
        zoomScale = 2.75;
      } else if (galleryMainEl.classList.contains('product-gallery__main--landscape')) {
        zoomScale = 2;
      } else {
        zoomScale = 2.25;
      }
      mainImageEl.style.transformOrigin = x + '% ' + y + '%';
      mainImageEl.style.transform = 'scale(' + zoomScale + ')';
      galleryMainEl.classList.add('is-zooming');
    });

    galleryMainEl.addEventListener('mouseleave', resetZoom);
  }

  function applyGalleryImage(img) {
    mainImageEl.src = img.src;
    mainImageEl.alt = img.alt;
    mainImageEl.style.transform = '';
    mainImageEl.style.transformOrigin = '';
    galleryMainEl.classList.remove('is-zooming');
    var isMockup = img.mockup || img.src.indexOf('/mockups/') !== -1;
    galleryMainEl.classList.toggle('product-gallery__main--landscape', isMockup);
    galleryMainEl.classList.toggle('product-gallery__main--contain', isMockup || !!product.imageContain || product.category === 'bows');
  }

  function getGalleryImages() {
    var images = (product.images || []).slice();

    if (product.category === 'bows') {
      return images.filter(function (img) {
        return !img.mockup && img.src.indexOf('/mockups/') === -1;
      });
    }

    return images;
  }

  function renderGallery() {
    var galleryImages = getGalleryImages();
    if (!mainImageEl || !galleryImages.length) return;

    var first = galleryImages[0];
    applyGalleryImage(first);

    if (product.imageLandscape && !first.mockup && first.src.indexOf('/mockups/') === -1) {
      galleryMainEl.classList.add('product-gallery__main--landscape');
    }

    if (galleryImages.length > 1 && thumbsEl) {
      thumbsEl.hidden = false;
      thumbsEl.innerHTML = galleryImages.map(function (img, index) {
        return '<button type="button" class="product-gallery__thumb' + (index === 0 ? ' is-active' : '') + '" data-gallery-index="' + index + '" aria-label="View image ' + (index + 1) + '">' +
          '<img src="' + img.src + '" alt="">' +
        '</button>';
      }).join('');

      thumbsEl.querySelectorAll('[data-gallery-index]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var idx = parseInt(btn.getAttribute('data-gallery-index'), 10);
          applyGalleryImage(galleryImages[idx]);
          thumbsEl.querySelectorAll('.product-gallery__thumb').forEach(function (thumb) {
            thumb.classList.toggle('is-active', thumb === btn);
          });
        });
      });
    }
  }

  function renderProductTitle() {
    if (!titleEl) return;
    if (product.titleType && product.titlePattern) {
      titleEl.innerHTML = '<span class="product-title__type">' + product.titleType + '</span><span class="product-title__pattern">' + product.titlePattern + '</span>';
    } else {
      titleEl.textContent = product.title;
    }
  }

  function renderDetails() {
    if (categoryEl) categoryEl.textContent = product.categoryLabel;
    renderProductTitle();

    if (priceEl) {
      if (typeof product.price === 'number') {
        if (product.compareAtPrice && product.compareAtPrice > product.price) {
          priceEl.innerHTML = '<span class="product-details__price-compare">' + formatPrice(product.compareAtPrice) + '</span> ' + formatPrice(product.price);
        } else {
          priceEl.textContent = formatPrice(product.price);
        }
        priceEl.classList.remove('product-details__price--label');
      } else {
        priceEl.textContent = product.priceLabel || '';
        priceEl.classList.add('product-details__price--label');
      }
    }

    if (quoteEl && product.quote) {
      quoteEl.hidden = false;
      quoteEl.innerHTML = '<p>&ldquo;' + product.quote + '&rdquo;</p>';
    }

    if (excerptEl) excerptEl.textContent = product.excerpt || '';

    if (taxonomyEl) {
      var tags = (product.tags || []).join(', ');
      var brandName = product.brand || 'ROWEM';
      var brandHtml = product.brandUrl
        ? '<a href="' + product.brandUrl + '" target="_blank" rel="noopener noreferrer">' + brandName + '</a>'
        : brandName;
      taxonomyEl.innerHTML =
        '<div class="product-taxonomy__row"><dt>Category</dt><dd>' + product.categoryLabel + ', ' + product.collectionLabel + '</dd></div>' +
        (tags ? '<div class="product-taxonomy__row"><dt>Tag</dt><dd>' + tags + '</dd></div>' : '') +
        '<div class="product-taxonomy__row"><dt>Brand</dt><dd>' + brandHtml + '</dd></div>';
    }

    if (product.preorderNote && actionsEl) {
      var notice = document.createElement('p');
      notice.className = 'product-preorder-note';
      notice.textContent = product.preorderNote;
      actionsEl.parentNode.insertBefore(notice, actionsEl);
    }

    if (product.collection === 'apparel' && excerptEl) {
      var sizeLink = document.createElement('p');
      sizeLink.className = 'product-size-link';
      sizeLink.innerHTML = '<a href="size-guide.html">View size guide</a> — bamboo clothing should fit snug.';
      excerptEl.insertAdjacentElement('afterend', sizeLink);
    }

    if (product.comboDeals && product.comboDeals.length && actionsEl) {
      var comboWrap = document.createElement('div');
      comboWrap.className = 'product-combo-deals';
      comboWrap.innerHTML = '<p class="product-combo-deals__label caps">Combo deals</p>';
      product.comboDeals.forEach(function (deal) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn--outline btn--small product-combo-deals__btn';
        btn.innerHTML = '<span>' + deal.label + ' — $' + deal.price + '</span>';
        btn.addEventListener('click', function () {
          if (!window.ROWEM_CART || !deal.items) return;
          deal.items.forEach(function (id) {
            var p = window.ROWEM_PRODUCTS[id];
            if (p) window.ROWEM_CART.addFromProduct(p, { quantity: 1 });
          });
        });
        comboWrap.appendChild(btn);
      });
      actionsEl.insertAdjacentElement('afterend', comboWrap);
    }
  }

  function renderVariants() {
    if (!variantsEl) return;
    variantsEl.innerHTML = '';

    if (product.sizes && product.sizes.length) {
      var sizeGroup = document.createElement('div');
      var isToyOption = product.category === 'outdoor-trap' || product.collection === 'critter-gitr';
      var variantLabel = isToyOption ? 'Option' : 'Size';
      sizeGroup.className = 'product-variant';
      sizeGroup.innerHTML =
        '<label class="product-variant__label" for="product-size">' + variantLabel + '</label>' +
        '<select id="product-size" class="product-variant__select" name="size" required data-product-size>' +
        '<option value="">Choose an option</option>' +
        product.sizes.map(function (size) {
          return '<option value="' + size + '">' + size + '</option>';
        }).join('') +
        '</select>';
      variantsEl.appendChild(sizeGroup);
    }
  }

  function renderCta() {
    if (!ctaEl || !formEl) return;

    if (product.cta === 'contact') {
      if (quantityEl) quantityEl.hidden = true;
      ctaEl.textContent = product.priceLabel === 'Contact us' ? 'Contact us' : 'Order now';
      ctaEl.type = 'button';
      ctaEl.addEventListener('click', function () {
        var email = product.contactEmail || 'sales@rowemproducts.com';
        var subject = encodeURIComponent(product.contactSubject || product.title);
        window.location.href = 'mailto:' + email + '?subject=' + subject;
      });
      formEl.addEventListener('submit', function (e) { e.preventDefault(); });
      return;
    }

    if (product.cta === 'preorder') {
      if (quantityEl) quantityEl.hidden = true;
      ctaEl.textContent = 'Pre-order';
      formEl.addEventListener('submit', function (e) {
        e.preventDefault();
        if (window.ROWEM_CART && typeof product.price === 'number') {
          window.ROWEM_CART.addFromProduct(product, { quantity: 1 });
        }
        var original = ctaEl.textContent;
        ctaEl.textContent = 'Added to pre-order';
        setTimeout(function () { ctaEl.textContent = original; }, 1400);
      });
      return;
    }

    if (product.cta === 'soldout') {
      if (quantityEl) quantityEl.hidden = true;
      ctaEl.textContent = 'Sold out';
      ctaEl.disabled = true;
      ctaEl.classList.add('btn--disabled');
      formEl.addEventListener('submit', function (e) { e.preventDefault(); });
      return;
    }

    ctaEl.textContent = 'Add to cart';
    formEl.addEventListener('submit', function (e) {
      e.preventDefault();
      var sizeSelect = document.querySelector('[data-product-size]');
      if (sizeSelect && !sizeSelect.value) {
        sizeSelect.focus();
        return;
      }
      var qtyInput = document.querySelector('[data-qty-input]');
      var quantity = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;
      if (window.ROWEM_CART && typeof product.price === 'number') {
        window.ROWEM_CART.addFromProduct(product, {
          size: sizeSelect ? sizeSelect.value : '',
          quantity: quantity
        });
      }
      var original = ctaEl.textContent;
      ctaEl.textContent = 'Added';
      setTimeout(function () { ctaEl.textContent = original; }, 1400);
    });
  }

  function renderTabs() {
    if (descPanel) descPanel.innerHTML = product.description || '';
    if (detailsPanel && product.details) {
      detailsPanel.innerHTML = '<table class="product-details-table"><tbody>' +
        Object.keys(product.details).map(function (key) {
          return '<tr><th>' + key + '</th><td>' + product.details[key] + '</td></tr>';
        }).join('') +
      '</tbody></table>';
    }

    document.querySelectorAll('[data-product-tab]').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = tab.getAttribute('data-product-tab');
        document.querySelectorAll('[data-product-tab]').forEach(function (t) {
          var active = t.getAttribute('data-product-tab') === target;
          t.classList.toggle('is-active', active);
          t.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        document.querySelectorAll('[data-product-panel]').forEach(function (panel) {
          var show = panel.getAttribute('data-product-panel') === target;
          panel.classList.toggle('is-active', show);
          panel.hidden = !show;
        });
      });
    });
  }

  function getBowProductImage(item) {
    if (!item.images || !item.images.length) return null;
    var bowImage = item.images.find(function (img) {
      return !img.mockup && img.src.indexOf('/mockups/') === -1;
    });
    return bowImage || item.images[0];
  }

  function getRelatedProducts() {
    var related = Object.keys(window.ROWEM_PRODUCTS)
      .map(function (id) { return window.ROWEM_PRODUCTS[id]; })
      .filter(function (item) {
        return item.id !== product.id && item.collection === product.collection;
      });

    var matchingBow = null;
    if (product.printKey && product.category === 'babies') {
      matchingBow = related.find(function (item) {
        return item.category === 'bows' && item.printKey === product.printKey;
      });
    }

    var others = related.filter(function (item) {
      return !matchingBow || item.id !== matchingBow.id;
    });

    others.sort(function (a, b) {
      if (a.category === product.category && b.category !== product.category) return -1;
      if (b.category === product.category && a.category !== product.category) return 1;
      return 0;
    });

    return (matchingBow ? [matchingBow].concat(others) : others).slice(0, 4);
  }

  function renderRelated() {
    var related = getRelatedProducts();
    if (!relatedGrid || !related.length) return;

    relatedSection.hidden = false;
    relatedGrid.innerHTML = related.map(function (item) {
      var price = typeof item.price === 'number'
        ? formatPrice(item.price)
        : (item.priceLabel || '');
      var containClass = item.imageContain ? ' product-item__bg--contain' : '';
      var linkClass = item.imageLandscape ? ' product-link--landscape' : '';
      var cardImage = item.category === 'bows'
        ? getBowProductImage(item)
        : (item.images && item.images[0] ? item.images[0] : null);
      var imageHtml = '';

      if (item.category === 'bows' && cardImage) {
        imageHtml =
          '<div class="product-item__image double__image">' +
            '<a class="product-link" href="' + window.getProductUrl(item.id) + '">' +
              '<div class="product-item__bg product-item__bg--default">' +
                '<img src="' + cardImage.src + '" alt="' + cardImage.alt + '" loading="lazy">' +
              '</div>' +
              '<div class="product-item__bg__under">' +
                '<img src="' + cardImage.src + '" alt="" loading="lazy">' +
              '</div>' +
            '</a>' +
          '</div>';
      } else if (cardImage) {
        imageHtml =
          '<div class="product-item__image">' +
            '<a class="product-link' + linkClass + '" href="' + window.getProductUrl(item.id) + '">' +
              '<div class="product-item__bg product-item__bg--default' + containClass + '">' +
                '<img src="' + cardImage.src + '" alt="' + cardImage.alt + '" loading="lazy">' +
              '</div>' +
            '</a>' +
          '</div>';
      } else {
        return '';
      }

      return '<article class="product-item product-item--catalog"' + (item.category === 'bows' ? ' data-category="bows"' : '') + '">' +
        imageHtml +
        '<div class="product-item__info body-medium">' +
          '<p class="product-item__category caps">' + item.categoryLabel + '</p>' +
          '<h2 class="product-item__title"><a href="' + window.getProductUrl(item.id) + '">' + item.title + '</a></h2>' +
          '<div class="product-item__price">' + price + '</div>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  function initQuantity() {
    var input = document.querySelector('[data-qty-input]');
    var minus = document.querySelector('[data-qty-minus]');
    var plus = document.querySelector('[data-qty-plus]');
    if (!input) return;

    if (minus) {
      minus.addEventListener('click', function () {
        input.value = Math.max(1, parseInt(input.value, 10) - 1 || 1);
      });
    }
    if (plus) {
      plus.addEventListener('click', function () {
        input.value = Math.min(99, parseInt(input.value, 10) + 1 || 1);
      });
    }
  }

  setMeta();
  renderBreadcrumb();
  renderGallery();
  initGalleryZoom();
  renderDetails();
  renderVariants();
  renderCta();
  renderTabs();
  renderRelated();
  initQuantity();
})();
