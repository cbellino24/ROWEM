/**
 * ROWEM � Broadcast-style interactions (Giggles LA pattern)
 */

(function () {
  'use strict';

  /* AOS init with custom hero + img-in animations */
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: true,
      offset: 40,
      disable: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    });
  }

  /* Stagger hero children like Broadcast theme */
  document.querySelectorAll('[data-aos-order]').forEach(function (el) {
    var order = parseInt(el.getAttribute('data-aos-order'), 10) || 1;
    el.setAttribute('data-aos-delay', String((order - 1) * 120));
  });

  /* Header fade on load */
  var header = document.querySelector('[data-header]');
  if (header) {
    requestAnimationFrame(function () {
      header.classList.add('is-visible');
    });
  }

  /* Mobile drawer */
  var menuToggle = document.querySelector('[data-menu-toggle]');
  var menuClose = document.querySelector('[data-menu-close]');
  var mobileNav = document.querySelector('[data-mobile-nav]');
  var menuOverlay = document.querySelector('[data-menu-overlay]');

  function openMenu() {
    if (!mobileNav) return;
    mobileNav.classList.add('is-open');
    mobileNav.setAttribute('aria-hidden', 'false');
    if (menuOverlay) menuOverlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    mobileNav.querySelectorAll('[data-drawer-item]').forEach(function (item, i) {
      item.style.animationDelay = (150 + i * 50) + 'ms';
      item.classList.add('is-animated');
    });
  }

  function closeMenu() {
    if (!mobileNav) return;
    mobileNav.classList.remove('is-open');
    mobileNav.setAttribute('aria-hidden', 'true');
    if (menuOverlay) menuOverlay.classList.remove('is-open');
    document.body.style.overflow = '';
    mobileNav.querySelectorAll('[data-drawer-item]').forEach(function (item) {
      item.classList.remove('is-animated');
    });
  }

  if (menuToggle) menuToggle.addEventListener('click', openMenu);
  if (menuClose) menuClose.addEventListener('click', closeMenu);
  if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);
  if (mobileNav) {
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  /* Hero parallax */
  var parallaxPane = document.querySelector('[data-parallax-img]');
  if (parallaxPane && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var heroSection = document.querySelector('[data-hero]');
    window.addEventListener('scroll', function () {
      if (!heroSection) return;
      var rect = heroSection.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        var offset = rect.top * 0.25;
        parallaxPane.style.transform = 'translate3d(0, ' + offset + 'px, 0) scale(1.08)';
      }
    }, { passive: true });
  }

  /* Collection page filters */
  var collectionGrid = document.querySelector('[data-collection-grid]');
  if (collectionGrid) {
    var collectionTabs = document.querySelectorAll('[data-collection-filter]');
    var collectionColorButtons = document.querySelectorAll('[data-collection-color]');
    var collectionSearch = document.querySelector('[data-collection-search]');
    var collectionCount = document.querySelector('[data-collection-count]');
    var collectionResults = document.querySelector('[data-collection-results]');
    var collectionSort = document.querySelector('[data-collection-sort]');
    var collectionItems = Array.from(collectionGrid.querySelectorAll('[data-category]'));
    var filterPanel = document.querySelector('[data-collection-filters]');
    var filterToggle = document.querySelector('[data-filter-toggle]');
    var filterClose = document.querySelector('[data-filter-close]');
    var filterOverlay = document.querySelector('[data-filter-overlay]');
    var activeFilter = 'all';
    var activeColors = new Set();

    function openFilterPanel() {
      if (!filterPanel) return;
      filterPanel.classList.add('is-open');
      if (filterOverlay) filterOverlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    function closeFilterPanel() {
      if (!filterPanel) return;
      filterPanel.classList.remove('is-open');
      if (filterOverlay) filterOverlay.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    if (filterToggle) filterToggle.addEventListener('click', openFilterPanel);
    if (filterClose) filterClose.addEventListener('click', closeFilterPanel);
    if (filterOverlay) filterOverlay.addEventListener('click', closeFilterPanel);

    function getSearchQuery() {
      return collectionSearch ? collectionSearch.value.trim().toLowerCase() : '';
    }

    function itemMatchesFilters(item) {
      var category = item.getAttribute('data-category');
      var color = item.getAttribute('data-color') || '';
      var searchText = (item.getAttribute('data-search-text') || '').toLowerCase();
      var query = getSearchQuery();

      if (activeFilter !== 'all' && category !== activeFilter) return false;
      if (activeColors.size > 0 && !activeColors.has(color)) return false;
      if (query && searchText.indexOf(query) === -1) return false;
      return true;
    }

    function updateColorCounts() {
      collectionColorButtons.forEach(function (btn) {
        var color = btn.getAttribute('data-collection-color');
        var countEl = btn.querySelector('[data-color-count]');
        if (!color || !countEl) return;
        var count = collectionItems.filter(function (item) {
          return item.getAttribute('data-color') === color;
        }).length;
        countEl.textContent = '(' + count + ')';
      });
    }

    function sortCollectionItems() {
      if (!collectionSort) return;
      var sortValue = collectionSort.value;
      if (sortValue === 'default') return;

      var visibleItems = collectionItems.filter(function (item) {
        return !item.classList.contains('is-hidden');
      });

      visibleItems.sort(function (a, b) {
        var titleA = (a.getAttribute('data-sort-title') || a.textContent || '').toLowerCase();
        var titleB = (b.getAttribute('data-sort-title') || b.textContent || '').toLowerCase();
        if (titleA < titleB) return sortValue === 'title-asc' ? -1 : 1;
        if (titleA > titleB) return sortValue === 'title-asc' ? 1 : -1;
        return 0;
      });

      visibleItems.forEach(function (item) {
        collectionGrid.appendChild(item);
      });
    }

    function refreshCollection(options) {
      options = options || {};
      var visible = 0;

      collectionItems.forEach(function (item) {
        var show = itemMatchesFilters(item);
        item.classList.toggle('is-hidden', !show);
        if (show) visible += 1;
      });

      collectionTabs.forEach(function (tab) {
        var isActive = tab.getAttribute('data-collection-filter') === activeFilter;
        tab.classList.toggle('is-active', isActive);
        if (tab.getAttribute('role') === 'tab') {
          tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        }
      });

      collectionColorButtons.forEach(function (btn) {
        var color = btn.getAttribute('data-collection-color');
        btn.classList.toggle('is-active', activeColors.has(color));
      });

      if (collectionCount) {
        collectionCount.textContent = visible + (visible === 1 ? ' product' : ' products');
      }

      if (collectionResults) {
        if (visible === 0) {
          collectionResults.textContent = 'No products found';
        } else {
          collectionResults.textContent = 'Results: 1 \u2013 ' + visible + ' of ' + visible + ' Products';
        }
      }

      sortCollectionItems();
      if (options.closePanel !== false) closeFilterPanel();
    }

    function applyCollectionFilter(filter, options) {
      activeFilter = filter || 'all';
      refreshCollection(options);
    }

    collectionTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var filter = tab.getAttribute('data-collection-filter') || 'all';
        applyCollectionFilter(filter);
        if (filter === 'all') {
          history.replaceState(null, '', window.location.pathname);
        } else {
          history.replaceState(null, '', '#' + filter);
        }
      });
    });

    collectionColorButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var color = btn.getAttribute('data-collection-color');
        if (!color) return;
        if (activeColors.has(color)) {
          activeColors.delete(color);
        } else {
          activeColors.add(color);
        }
        refreshCollection({ closePanel: false });
      });
    });

    if (collectionSearch) {
      collectionSearch.addEventListener('input', function () {
        refreshCollection({ closePanel: false });
      });
    }

    if (collectionSort) {
      collectionSort.addEventListener('change', sortCollectionItems);
    }

    updateColorCounts();

    var hash = window.location.hash.replace('#', '');
    if (hash && collectionItems.some(function (item) {
      return item.getAttribute('data-category') === hash;
    })) {
      applyCollectionFilter(hash, { closePanel: false });
    } else {
      applyCollectionFilter('all', { closePanel: false });
    }
  }

  /* Product grid sliders */
  document.querySelectorAll('[data-grid-slider]').forEach(function (slider) {
    var track = slider.querySelector('[data-grid-track]');
    var prev = slider.querySelector('[data-slider-prev]');
    var next = slider.querySelector('[data-slider-next]');
    if (!track) return;

    function scrollByDir(dir) {
      var card = track.querySelector('.product-item');
      var amount = card ? card.offsetWidth + 16 : 280;
      track.scrollBy({ left: dir * amount, behavior: 'smooth' });
    }

    if (prev) prev.addEventListener('click', function () { scrollByDir(-1); });
    if (next) next.addEventListener('click', function () { scrollByDir(1); });
  });

  /* Quick add feedback */
  document.querySelectorAll('.quick-add__button').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var label = btn.querySelector('span') || btn;
      var original = label.textContent;
      label.textContent = 'Added';
      setTimeout(function () { label.textContent = original; }, 1400);
    });
  });

  /* Testimonials slideshow */
  var testimonialSlider = document.querySelector('[data-testimonial-slider]');
  if (testimonialSlider) {
    var testimonialSlides = testimonialSlider.querySelectorAll('[data-testimonial-slide]');
    var testimonialPrev = testimonialSlider.querySelector('[data-testimonial-prev]');
    var testimonialNext = testimonialSlider.querySelector('[data-testimonial-next]');
    var testimonialIndex = 0;
    var testimonialTimer;

    function goToTestimonial(i) {
      testimonialIndex = (i + testimonialSlides.length) % testimonialSlides.length;
      testimonialSlides.forEach(function (slide, si) {
        slide.classList.toggle('is-active', si === testimonialIndex);
      });
    }

    function startTestimonialAutoplay() {
      clearInterval(testimonialTimer);
      testimonialTimer = setInterval(function () {
        goToTestimonial(testimonialIndex + 1);
      }, 9000);
    }

    function onTestimonialNav(dir) {
      goToTestimonial(testimonialIndex + dir);
      startTestimonialAutoplay();
    }

    if (testimonialPrev) {
      testimonialPrev.addEventListener('click', function (e) {
        e.preventDefault();
        onTestimonialNav(-1);
      });
    }
    if (testimonialNext) {
      testimonialNext.addEventListener('click', function (e) {
        e.preventDefault();
        onTestimonialNav(1);
      });
    }

    testimonialSlider.addEventListener('mouseenter', function () {
      clearInterval(testimonialTimer);
    });
    testimonialSlider.addEventListener('mouseleave', startTestimonialAutoplay);

    startTestimonialAutoplay();
  }

  /* Newsletter */
  var newsletterForm = document.querySelector('[data-newsletter-form]');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = newsletterForm.querySelector('input[type="email"]');
      if (input && input.value) {
        input.value = '';
        input.placeholder = 'Thank you for subscribing';
        setTimeout(function () { input.placeholder = 'Your email address'; }, 3000);
      }
    });
  }

  /* Duplicate marquee content for seamless loop */
  document.querySelectorAll('[data-ticker-text]').forEach(function (ticker) {
    ticker.innerHTML = ticker.innerHTML + ticker.innerHTML;
    ticker.parentElement.classList.remove('ticker--unloaded');
  });

  /* Images with text scroll — Our Mission */
  document.querySelectorAll('[data-images-with-text-scroll]').forEach(function (section) {
    var items = Array.from(section.querySelectorAll('.images-with-text-scroll__item'));
    var texts = Array.from(section.querySelectorAll('.images-with-text-scroll__text'));
    var dots = Array.from(section.querySelectorAll('[data-scroll-dot]'));
    var currentIndex = 0;
    var desktopQuery = window.matchMedia('(min-width: 1000px)');
    var observer;

    function selectItem(index, force) {
      index = Math.max(0, Math.min(index, items.length - 1));
      if (!force && index === currentIndex) return;
      currentIndex = index;
      items.forEach(function (item, i) {
        item.classList.toggle('is-selected', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.setAttribute('aria-current', i === index ? 'true' : 'false');
      });
    }

    function setupDesktopObserver() {
      if (observer) observer.disconnect();
      if (!desktopQuery.matches) {
        selectItem(0, true);
        return;
      }

      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var idx = texts.indexOf(entry.target);
            if (idx >= 0) selectItem(idx);
          }
        });
      }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

      texts.forEach(function (text) { observer.observe(text); });
      selectItem(0, true);
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        selectItem(parseInt(dot.getAttribute('data-scroll-dot'), 10) || 0);
      });
    });

    var touchStartX = 0;
    section.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    section.addEventListener('touchend', function (e) {
      if (desktopQuery.matches) return;
      var dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 48) {
        selectItem(currentIndex + (dx < 0 ? 1 : -1));
      }
    }, { passive: true });

    desktopQuery.addEventListener('change', setupDesktopObserver);
    setupDesktopObserver();
  });

  /* Text with icons — mobile carousel */
  document.querySelectorAll('[data-text-with-icons]').forEach(function (carousel) {
    var items = Array.from(carousel.querySelectorAll('.text-with-icons__item'));
    var dots = Array.from(document.querySelectorAll('[data-icons-dot]'));
    var section = carousel.closest('.shopify-section--text-with-icons');
    if (section) {
      dots = Array.from(section.querySelectorAll('[data-icons-dot]'));
    }
    var currentIndex = 0;
    var mobileQuery = window.matchMedia('(max-width: 699px)');
    var touchStartX = 0;
    var timer;

    function selectItem(index) {
      index = Math.max(0, Math.min(index, items.length - 1));
      if (index === currentIndex) return;
      currentIndex = index;
      items.forEach(function (item, i) {
        item.classList.toggle('is-selected', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.setAttribute('aria-current', i === index ? 'true' : 'false');
      });
    }

    function startAutoplay() {
      clearInterval(timer);
      if (!mobileQuery.matches) return;
      timer = setInterval(function () {
        selectItem((currentIndex + 1) % items.length);
      }, 5000);
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        selectItem(parseInt(dot.getAttribute('data-icons-dot'), 10) || 0);
        startAutoplay();
      });
    });

    carousel.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    carousel.addEventListener('touchend', function (e) {
      if (!mobileQuery.matches) return;
      var dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 48) {
        selectItem(currentIndex + (dx < 0 ? 1 : -1));
        startAutoplay();
      }
    }, { passive: true });

    mobileQuery.addEventListener('change', startAutoplay);
    startAutoplay();
  });

  /* Instagram feed load more */
  document.querySelectorAll('[data-insta-feed]').forEach(function (feed) {
    var loadMoreBtn = feed.querySelector('[data-insta-load-more]');
    var hiddenItems = Array.from(feed.querySelectorAll('.ti-widget-item--hidden'));
    if (!loadMoreBtn || !hiddenItems.length) {
      if (loadMoreBtn) loadMoreBtn.classList.add('is-hidden');
      return;
    }

    loadMoreBtn.addEventListener('click', function () {
      hiddenItems.forEach(function (item) {
        item.hidden = false;
        item.classList.remove('ti-widget-item--hidden');
      });
      loadMoreBtn.classList.add('is-hidden');
    });
  });

  /* FAQ accordion — one open at a time */
  document.querySelectorAll('[data-faq-accordion]').forEach(function (accordion) {
    accordion.querySelectorAll('.rowem-faq__item').forEach(function (item) {
      item.addEventListener('toggle', function () {
        if (!item.open) return;
        accordion.querySelectorAll('.rowem-faq__item').forEach(function (other) {
          if (other !== item) other.open = false;
        });
      });
    });
  });
})();
