/**
 * ROWEM collection quick add — apparel, gear, books grids
 */
(function () {
  'use strict';

  if (!window.ROWEM_CART || !window.ROWEM_PRODUCTS) return;

  var modal;
  var modalProduct;
  var modalConfirm;

  function canQuickAdd(product) {
    return product && product.cta === 'add' && typeof product.price === 'number';
  }

  function buttonLabel() {
    return 'Quick add';
  }

  function showAddedFeedback(card) {
    card.querySelectorAll('.quick-add__button').forEach(function (btn) {
      var label = btn.querySelector('span') || btn;
      var original = label.getAttribute('data-quick-add-label') || label.textContent;
      label.setAttribute('data-quick-add-label', original);
      label.textContent = 'Added';
      setTimeout(function () { label.textContent = original; }, 1400);
    });
  }

  function ensureModal() {
    if (modal) return;

    modal = document.createElement('div');
    modal.className = 'quick-add-modal';
    modal.hidden = true;
    modal.innerHTML =
      '<div class="quick-add-modal__backdrop" data-quick-add-close></div>' +
      '<div class="quick-add-modal__panel" role="dialog" aria-modal="true" aria-labelledby="quick-add-modal-title">' +
        '<button type="button" class="quick-add-modal__close" data-quick-add-close aria-label="Close">&times;</button>' +
        '<h2 class="quick-add-modal__title" id="quick-add-modal-title">Select a size</h2>' +
        '<p class="quick-add-modal__product" data-quick-add-product></p>' +
        '<label class="quick-add-modal__label" for="quick-add-size">Size</label>' +
        '<select id="quick-add-size" class="quick-add-modal__select" data-quick-add-size></select>' +
        '<button type="button" class="btn btn--solid btn--primary btn--large quick-add-modal__submit" data-quick-add-submit>Add to cart</button>' +
      '</div>';
    document.body.appendChild(modal);

    modal.querySelectorAll('[data-quick-add-close]').forEach(function (el) {
      el.addEventListener('click', closeModal);
    });

    modalConfirm = modal.querySelector('[data-quick-add-submit]');
    modalConfirm.addEventListener('click', function () {
      if (!modalProduct) return;
      var select = modal.querySelector('[data-quick-add-size]');
      if (!select || !select.value) {
        select.focus();
        return;
      }
      window.ROWEM_CART.addFromProduct(modalProduct, { size: select.value });
      closeModal();
      var card = document.getElementById(modalProduct.id);
      if (card) showAddedFeedback(card);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal && !modal.hidden) closeModal();
    });
  }

  function openModal(product) {
    ensureModal();
    modalProduct = product;
    modal.querySelector('[data-quick-add-product]').textContent = product.title;
    var select = modal.querySelector('[data-quick-add-size]');
    select.innerHTML =
      '<option value="">Choose a size</option>' +
      product.sizes.map(function (size) {
        return '<option value="' + size + '">' + size + '</option>';
      }).join('');
    modal.hidden = false;
    document.body.classList.add('quick-add-modal-open');
    select.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    modalProduct = null;
    document.body.classList.remove('quick-add-modal-open');
  }

  function injectButtons(card, product) {
    if (!canQuickAdd(product)) return;

    var label = buttonLabel(product);
    var desktopHtml =
      '<div class="quick-add__holder desktop">' +
        '<button class="quick-add__button btn btn--solid btn--small btn--primary" type="button" data-quick-add><span>' + label + '</span></button>' +
      '</div>';
    var mobileHtml =
      '<div class="quick-add__holder mobile">' +
        '<button class="quick-add__button btn btn--solid btn--small btn--primary" type="button" data-quick-add><span>' + label + '</span></button>' +
      '</div>';

    card.classList.add('product-item--has-quickbuy');

    if (!card.querySelector('.quick-add__holder.desktop')) {
      var link = card.querySelector('.product-link');
      if (link) link.insertAdjacentHTML('beforeend', desktopHtml);
    }

    if (!card.querySelector('.quick-add__holder.mobile')) {
      var info = card.querySelector('.product-item__info');
      if (info) info.insertAdjacentHTML('beforeend', mobileHtml);
    }

    card.querySelectorAll('.quick-add__button span').forEach(function (span) {
      if (!span.getAttribute('data-quick-add-label')) {
        span.setAttribute('data-quick-add-label', 'Quick add');
        span.textContent = 'Quick add';
      }
    });
  }

  function handleQuickAdd(card) {
    var product = window.ROWEM_PRODUCTS[card.id];
    if (!canQuickAdd(product)) return;

    if (product.sizes && product.sizes.length) {
      openModal(product);
      return;
    }

    window.ROWEM_CART.addFromProduct(product);
    showAddedFeedback(card);
  }

  function initCollectionGrids() {
    document.querySelectorAll('[data-collection-grid] .product-item[id]').forEach(function (card) {
      var product = window.ROWEM_PRODUCTS[card.id];
      if (product) injectButtons(card, product);
    });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-quick-add], .quick-add__button');
    if (!btn) return;

    var card = btn.closest('.product-item');
    if (!card || !card.closest('[data-collection-grid]')) return;

    e.preventDefault();
    e.stopPropagation();
    handleQuickAdd(card);
  });

  initCollectionGrids();
})();
