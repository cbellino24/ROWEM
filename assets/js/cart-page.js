/**
 * ROWEM cart page renderer
 */
(function () {
  'use strict';

  var page = document.querySelector('[data-cart-page]');
  if (!page || !window.ROWEM_CART) return;

  var itemsEl = document.querySelector('[data-cart-items]');
  var summaryEl = document.querySelector('[data-cart-summary]');
  var emptyEl = document.querySelector('[data-cart-empty]');

  function render() {
    var items = window.ROWEM_CART.getItems();
    var hasItems = items.length > 0;

    if (itemsEl) itemsEl.hidden = !hasItems;
    if (summaryEl) summaryEl.hidden = !hasItems;
    if (emptyEl) emptyEl.hidden = hasItems;

    if (!hasItems) return;

    itemsEl.innerHTML = items.map(function (item) {
      var sizeHtml = item.size
        ? '<p class="cart-item__meta">Size: ' + item.size + '</p>'
        : '';
      return '<article class="cart-item" data-cart-item="' + item.key + '">' +
        '<a href="' + item.url + '" class="cart-item__image">' +
          '<img src="' + item.image + '" alt="" loading="lazy">' +
        '</a>' +
        '<div class="cart-item__details">' +
          '<h2 class="cart-item__title"><a href="' + item.url + '">' + item.title + '</a></h2>' +
          sizeHtml +
          '<p class="cart-item__price">' + window.ROWEM_CART.formatPrice(item.price) + '</p>' +
        '</div>' +
        '<div class="cart-item__actions">' +
          '<div class="cart-qty" data-cart-qty>' +
            '<button type="button" class="cart-qty__btn" data-cart-qty-minus aria-label="Decrease quantity">−</button>' +
            '<input type="number" class="cart-qty__input" value="' + item.quantity + '" min="1" max="99" aria-label="Quantity" data-cart-qty-input>' +
            '<button type="button" class="cart-qty__btn" data-cart-qty-plus aria-label="Increase quantity">+</button>' +
          '</div>' +
          '<p class="cart-item__line-total">' + window.ROWEM_CART.formatPrice(item.price * item.quantity) + '</p>' +
          '<button type="button" class="cart-item__remove" data-cart-remove>Remove</button>' +
        '</div>' +
      '</article>';
    }).join('');

    var subtotal = window.ROWEM_CART.getSubtotal();
    var threshold = window.ROWEM_CART.FREE_SHIPPING_THRESHOLD;
    var remaining = Math.max(0, threshold - subtotal);
    var shippingNote = remaining > 0
      ? 'Add ' + window.ROWEM_CART.formatPrice(remaining) + ' more for free shipping.'
      : 'You qualify for free shipping.';

    summaryEl.innerHTML =
      '<div class="cart-summary">' +
        '<h2 class="cart-summary__title">Order Summary</h2>' +
        '<div class="cart-summary__row">' +
          '<span>Subtotal</span>' +
          '<span data-cart-subtotal>' + window.ROWEM_CART.formatPrice(subtotal) + '</span>' +
        '</div>' +
        '<p class="cart-summary__note">' + shippingNote + '</p>' +
        '<a href="mailto:sales@rowemproducts.com?subject=' + encodeURIComponent('ROWEM order request') + '&body=' + window.ROWEM_CART.buildOrderEmailBody() + '" class="btn btn--solid btn--primary btn--large cart-summary__checkout">Email Order</a>' +
        '<p class="cart-summary__fine">We will confirm your order and send payment details by email.</p>' +
        '<a href="apparel.html" class="cart-summary__continue">Continue shopping</a>' +
      '</div>';

    bindEvents();
  }

  function bindEvents() {
    if (!itemsEl) return;

    itemsEl.querySelectorAll('[data-cart-item]').forEach(function (row) {
      var key = row.getAttribute('data-cart-item');
      var input = row.querySelector('[data-cart-qty-input]');
      var minus = row.querySelector('[data-cart-qty-minus]');
      var plus = row.querySelector('[data-cart-qty-plus]');
      var removeBtn = row.querySelector('[data-cart-remove]');

      if (minus) {
        minus.addEventListener('click', function () {
          window.ROWEM_CART.updateQuantity(key, parseInt(input.value, 10) - 1 || 1);
        });
      }

      if (plus) {
        plus.addEventListener('click', function () {
          window.ROWEM_CART.updateQuantity(key, parseInt(input.value, 10) + 1 || 1);
        });
      }

      if (input) {
        input.addEventListener('change', function () {
          window.ROWEM_CART.updateQuantity(key, parseInt(input.value, 10) || 1);
        });
      }

      if (removeBtn) {
        removeBtn.addEventListener('click', function () {
          window.ROWEM_CART.removeItem(key);
        });
      }
    });
  }

  document.addEventListener('rowem:cart-updated', render);
  render();
})();
