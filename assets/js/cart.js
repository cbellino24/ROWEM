/**
 * ROWEM cart — localStorage cart + header badge
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'rowem-cart';
  var FREE_SHIPPING_THRESHOLD = 95;

  function getItems() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
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

  function updateHeaderBadge() {
    var count = getCount();
    document.querySelectorAll('.header__cart__status').forEach(function (el) {
      el.textContent = String(count);
    });
  }

  function addItem(item) {
    var items = getItems();
    var key = lineKey(item.id, item.size);
    var existing = items.find(function (entry) {
      return entry.key === key;
    });

    if (existing) {
      existing.quantity = Math.min(99, existing.quantity + item.quantity);
    } else {
      items.push({
        key: key,
        id: item.id,
        title: item.title,
        price: item.price,
        size: item.size || '',
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
    lines.push('', 'Subtotal: ' + formatPrice(getSubtotal()));
    return encodeURIComponent(lines.join('\n'));
  }

  function addFromProduct(product, options) {
    if (!product || typeof product.price !== 'number') return false;
    options = options || {};
    addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      size: options.size || '',
      quantity: options.quantity || 1,
      image: product.images && product.images[0] ? product.images[0].src : '',
      url: window.getProductUrl ? window.getProductUrl(product.id) : ('product.html?id=' + encodeURIComponent(product.id))
    });
    return true;
  }

  window.ROWEM_CART = {
    FREE_SHIPPING_THRESHOLD: FREE_SHIPPING_THRESHOLD,
    getItems: getItems,
    getCount: getCount,
    getSubtotal: getSubtotal,
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
