document.addEventListener('DOMContentLoaded', function () {
  var section = document.querySelector('.customer-stories-section');
  if (!section) return;

  var grid = section.querySelector('.customer-stories__grid');
  if (!grid) return;

  var items = Array.prototype.slice.call(grid.querySelectorAll('.story-item'));
  if (!items.length) return;

  var pagination;
  var dots = [];
  var enabled = false;
  var MOBILE_BREAKPOINT = 900;
  var resizeTimer;

  function createPagination() {
    pagination = document.createElement('div');
    pagination.className = 'customer-stories__pagination';
    pagination.setAttribute('aria-hidden', 'false');
    pagination.style.display = 'flex';
    pagination.style.justifyContent = 'center';
    pagination.style.gap = '8px';
    pagination.style.marginTop = '12px';

    items.forEach(function (_, idx) {
      var btn = document.createElement('button');
      btn.className = 'customer-stories__dot';
      btn.setAttribute('data-index', idx);
      btn.setAttribute('aria-label', 'View story ' + (idx + 1));
      btn.style.width = '8px';
      btn.style.height = '8px';
      btn.style.borderRadius = '50%';
      btn.style.border = 'none';
      btn.style.background = 'rgba(255,255,255,0.35)';
      btn.style.padding = '0';
      btn.style.cursor = 'pointer';
      btn.style.transition = 'all 0.25s ease';

      btn.addEventListener('click', function () {
        var i = parseInt(this.getAttribute('data-index'), 10);
        if (!isNaN(i) && items[i]) {
          items[i].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      });

      pagination.appendChild(btn);
      dots.push(btn);
    });

    grid.parentNode.insertBefore(pagination, grid.nextSibling);
  }

  function updateActiveDot(index) {
    dots.forEach(function (d, i) {
      if (i === index) {
        d.style.background = '#ffffff';
        d.style.width = '24px';
        d.style.borderRadius = '4px';
        d.setAttribute('aria-current', 'true');
      } else {
        d.style.background = 'rgba(255,255,255,0.35)';
        d.style.width = '8px';
        d.style.borderRadius = '50%';
        d.removeAttribute('aria-current');
      }
    });
  }

  function onScroll() {
    if (!enabled) return;
    var wrap = grid;
    var wrapRect = wrap.getBoundingClientRect();
    var center = wrapRect.left + wrapRect.width / 2;

    var closestIndex = 0;
    var closestDist = Infinity;
    items.forEach(function (item, idx) {
      var r = item.getBoundingClientRect();
      var itemCenter = r.left + r.width / 2;
      var dist = Math.abs(itemCenter - center);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = idx;
      }
    });

    updateActiveDot(closestIndex);
  }

  function enableCarousel() {
    if (enabled) return;
    enabled = true;

    // Make grid horizontally scrollable, preserve original display for desktop
    grid.style.display = 'flex';
    grid.style.flexWrap = 'nowrap';
    grid.style.overflowX = 'auto';
    grid.style.webkitOverflowScrolling = 'touch';
    grid.style.scrollSnapType = 'x mandatory';
    grid.style.gap = '16px';

    items.forEach(function (item, idx) {
      item.style.flex = '0 0 85%';
      item.style.scrollSnapAlign = 'center';
      item.style.marginRight = '0';
    });

    // create pagination if not present
    if (!pagination) createPagination();

    // mark first dot active
    updateActiveDot(0);

    // listen to scroll
    grid.addEventListener('scroll', onScroll, { passive: true });

    // also update on resize and orientation change
    window.addEventListener('orientationchange', onScroll);
  }

  function disableCarousel() {
    if (!enabled) return;
    enabled = false;

    // revert styles
    grid.style.display = '';
    grid.style.flexWrap = '';
    grid.style.overflowX = '';
    grid.style.webkitOverflowScrolling = '';
    grid.style.scrollSnapType = '';
    grid.style.gap = '';

    items.forEach(function (item) {
      item.style.flex = '';
      item.style.scrollSnapAlign = '';
      item.style.marginRight = '';
    });

    // remove pagination
    if (pagination && pagination.parentNode) {
      pagination.parentNode.removeChild(pagination);
      pagination = null;
      dots = [];
    }

    grid.removeEventListener('scroll', onScroll);
    window.removeEventListener('orientationchange', onScroll);
  }

  function checkBreakpoint() {
    var isMobile = window.matchMedia('(max-width: ' + MOBILE_BREAKPOINT + 'px)').matches;
    if (isMobile) enableCarousel(); else disableCarousel();
  }

  // initial
  checkBreakpoint();

  // debounce resize
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(checkBreakpoint, 150);
  });

});
