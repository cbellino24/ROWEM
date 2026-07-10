/**
 * ROWEM cart — localStorage cart + header badge
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'rowem-cart';
  var FREE_SHIPPING_THRESHOLD = 75;
  var FLAT_RATE_SHIPPING = 7.99;

  function getItems() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var items = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(items)) return [];
      var changed = false;
      items.forEach(function (item) {
        var liveTitle = resolveProductTitle(item.id, item.title);
        if (liveTitle && item.title !== liveTitle) {
          item.title = liveTitle;
          changed = true;
        }
        var nextSize = normalizeSize(item.size);
        if (nextSize !== (item.size || '')) {
          item.size = nextSize;
          item.key = lineKey(item.id, nextSize);
          changed = true;
        }
      });
      if (changed) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch (e) { /* ignore */ }
      }
      return items;
    } catch (e) {
      return [];
    }
  }

  function saveItems(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    updateHeaderBadge();
    document.dispatchEvent(new CustomEvent('rowem:cart-updated'));
  }

  function lineKey(id, size) {
    return id + '::' + (size || '');
  }

  function formatPrice(amount) {
    return '$' + amount.toFixed(2);
  }

  function getCount() {
    return getItems().reduce(function (sum, item) {
      return sum + item.quantity;
    }, 0);
  }

  function getSubtotal() {
    return getItems().reduce(function (sum, item) {
      return sum + item.price * item.quantity;
    }, 0);
  }

  function getCompareSubtotal() {
    return getItems().reduce(function (sum, item) {
      var compare = typeof item.compareAtPrice === 'number' && item.compareAtPrice > item.price
        ? item.compareAtPrice
        : item.price;
      return sum + compare * item.quantity;
    }, 0);
  }

  function getSavings() {
    return Math.max(0, getCompareSubtotal() - getSubtotal());
  }

  function getShipping(subtotal) {
    subtotal = typeof subtotal === 'number' ? subtotal : getSubtotal();
    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_RATE_SHIPPING;
  }

  function updateHeaderBadge() {
    var count = getCount();
    document.querySelectorAll('.header__cart__status').forEach(function (el) {
      el.textContent = String(count);
    });
  }

  var TITLE_OVERRIDES = {
    'p-bp1': 'Burr Paw - Tan',
    'p-bp2': 'Burr Paw - Black',
    'p-bp3': 'Burr Paw - Orange'
  };

  function resolveProductTitle(id, fallback) {
    var product = window.ROWEM_PRODUCTS && window.ROWEM_PRODUCTS[id];
    if (product && product.title) return product.title;
    if (TITLE_OVERRIDES[id]) return TITLE_OVERRIDES[id];
    if (fallback && /^colorway\s*\d+$/i.test(String(fallback).trim())) {
      return TITLE_OVERRIDES[id] || fallback;
    }
    return fallback || '';
  }

  function normalizeSize(size) {
    if (!size) return '';
    // Legacy Burr Paw variant labels stored before color names were fixed
    if (/^colorway\s*\d+$/i.test(String(size).trim())) return '';
    return size;
  }

  function addItem(item) {
    var items = getItems();
    var size = normalizeSize(item.size);
    var key = lineKey(item.id, size);
    var title = resolveProductTitle(item.id, item.title);
    var existing = items.find(function (entry) {
      return entry.key === key;
    });

    if (existing) {
      existing.quantity = Math.min(99, existing.quantity + item.quantity);
      existing.title = title;
      if (item.image) existing.image = item.image;
      if (item.compareAtPrice != null) existing.compareAtPrice = item.compareAtPrice;
    } else {
      items.push({
        key: key,
        id: item.id,
        title: title,
        price: item.price,
        compareAtPrice: item.compareAtPrice || null,
        size: size,
        quantity: item.quantity,
        image: item.image,
        url: item.url
      });
    }

    saveItems(items);
  }

  function updateQuantity(key, quantity) {
    var items = getItems();
    var item = items.find(function (entry) {
      return entry.key === key;
    });
    if (!item) return;

    if (quantity < 1) {
      removeItem(key);
      return;
    }

    item.quantity = Math.min(99, quantity);
    saveItems(items);
  }

  function removeItem(key) {
    saveItems(getItems().filter(function (entry) {
      return entry.key !== key;
    }));
  }

  function clearCart() {
    saveItems([]);
  }

  function buildOrderEmailBody() {
    var items = getItems();
    var lines = items.map(function (item) {
      var sizePart = item.size ? ' (' + item.size + ')' : '';
      return item.quantity + 'x ' + item.title + sizePart + ' — ' + formatPrice(item.price * item.quantity);
    });
    var subtotal = getSubtotal();
    var shipping = getShipping(subtotal);
    var savings = getSavings();
    lines.push('', 'Subtotal: ' + formatPrice(subtotal));
    if (savings > 0) {
      lines.push('You saved: ' + formatPrice(savings));
    }
    lines.push('Shipping: ' + (shipping ? formatPrice(shipping) : 'Free'));
    lines.push('Total: ' + formatPrice(subtotal + shipping));
    return encodeURIComponent(lines.join('\n'));
  }

  function addFromProduct(product, options) {
    if (!product || typeof product.price !== 'number') return false;
    options = options || {};
    addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      compareAtPrice: product.compareAtPrice || null,
      size: options.size || '',
      quantity: options.quantity || 1,
      image: product.images && product.images[0] ? product.images[0].src : '',
      url: window.getProductUrl ? window.getProductUrl(product.id) : ('product.html?id=' + encodeURIComponent(product.id))
    });
    return true;
  }

  window.ROWEM_CART = {
    FREE_SHIPPING_THRESHOLD: FREE_SHIPPING_THRESHOLD,
    FLAT_RATE_SHIPPING: FLAT_RATE_SHIPPING,
    getItems: getItems,
    getCount: getCount,
    getSubtotal: getSubtotal,
    getCompareSubtotal: getCompareSubtotal,
    getSavings: getSavings,
    getShipping: getShipping,
    addItem: addItem,
    addFromProduct: addFromProduct,
    updateQuantity: updateQuantity,
    removeItem: removeItem,
    clearCart: clearCart,
    updateHeaderBadge: updateHeaderBadge,
    formatPrice: formatPrice,
    buildOrderEmailBody: buildOrderEmailBody
  };

  updateHeaderBadge();
})();
