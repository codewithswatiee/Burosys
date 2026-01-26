document.addEventListener('DOMContentLoaded', function () {
  var tabs = window.sectionCategoryTabs || [];
  if (!tabs.length) return;

  var section = document.querySelector('.category-tabs-section');
  if (!section) return;
  var topTabs = section.querySelectorAll('.ct-top-tab');
  var itemsWrap = section.querySelector('.ct-items');
  var imgLink = section.querySelector('.ct-image-link');
  var img = section.querySelector('.ct-image');
  var exploreBtn = section.querySelector('.explore-now-btn');
  
  // Detect if device is mobile/touch
  var isMobile = window.matchMedia('(max-width: 900px)').matches;
  var currentOpenItem = null;

  function clearActiveTop() {
    topTabs.forEach(function (t) { t.classList.remove('active'); });
  }

  function renderItemsForTab(index) {
    var tab = tabs[index];
    itemsWrap.innerHTML = '';
    if (!tab) return;
    currentOpenItem = null;

    tab.items.forEach(function (it, i) {
      var wrapper = document.createElement('div');
      wrapper.className = 'ct-item-wrapper';

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ct-item-btn';
      btn.setAttribute('data-item-index', i);
      
      // Desktop: show + icon, Mobile: hide it
      if (isMobile) {
        btn.textContent = it.title;
      } else {
        btn.innerHTML = '<span class="ct-plus">+</span>' + it.title;
      }

      var itemHoverBox = document.createElement('div');
      itemHoverBox.className = 'ct-hover-box';

      // Build hover box content with CTA coming from the item's cta_label + cta_link
      var ctaLabel = it.cta_label || 'Explore Now';
      var ctaHref = it.cta_link || '';
      var hoverMain = '<div class="ct-hover-text">' + (it.content || '') + '</div>';
      var hoverFooter = '';
      if (ctaHref && !isMobile) {
        hoverFooter = '<div class="ct-hover-footer"><a href="' + ctaHref + '" class="ct-hover-link">' + ctaLabel + '</a></div>';
      }

      itemHoverBox.innerHTML = hoverMain + hoverFooter;
      itemHoverBox.setAttribute('aria-hidden', 'true');

      // hover box will be appended after the button so it appears below the label

      function showHover() {
        itemHoverBox.classList.add('visible');
        itemHoverBox.setAttribute('aria-hidden', 'false');
      }

      function hideHover() {
        itemHoverBox.classList.remove('visible');
        itemHoverBox.setAttribute('aria-hidden', 'true');
      }

      function toggleHover() {
        var isVisible = itemHoverBox.classList.contains('visible');
        if (!isVisible && currentOpenItem && currentOpenItem !== itemHoverBox) {
          currentOpenItem.classList.remove('visible');
          currentOpenItem.setAttribute('aria-hidden', 'true');
        }
        
        if (isVisible) {
          hideHover();
          currentOpenItem = null;
        } else {
          showHover();
          currentOpenItem = itemHoverBox;
        }
      }

      // Mobile: clicking selects the item and updates the mobile CTA (from customizer)
      if (isMobile) {
        btn.addEventListener('click', function() {
          // mark active button
          var previouslyActive = itemsWrap.querySelector('.ct-item-btn.active');
          if (previouslyActive) previouslyActive.classList.remove('active');
          btn.classList.add('active');

          // update explore button (mobile CTA) to this item's CTA link/label
          if (exploreBtn) {
            exploreBtn.href = it.cta_link || tab.link || '#';
            exploreBtn.textContent = it.cta_label || ctaLabel || 'Explore Now';
          }
        });
        btn.style.cursor = 'pointer';
      } else {
        // Desktop: hover behavior on the whole wrapper so the hover box stays open
        wrapper.addEventListener('mouseenter', showHover);
        wrapper.addEventListener('mouseleave', hideHover);
        wrapper.addEventListener('focusin', showHover);
        wrapper.addEventListener('focusout', hideHover);
      }

      wrapper.appendChild(btn);
      wrapper.appendChild(itemHoverBox);
      itemsWrap.appendChild(wrapper);
    });

    // update image + link
    img.src = tab.image || '';
    img.alt = tab.title || '';
    imgLink.href = tab.link || '#';
    
    // update explore now button (mobile only)
    if (exploreBtn) {
      // default to the first item's CTA if available, otherwise fall back to the tab link
      if (tab.items && tab.items.length) {
        exploreBtn.href = tab.items[0].cta_link || tab.items[0].link || tab.link || '#';
        exploreBtn.textContent = tab.items[0].cta_label || 'Explore Now';
      } else {
        exploreBtn.href = tab.link || '#';
        exploreBtn.textContent = 'Explore Now';
      }
    }
    
    // Scroll items container to start
    itemsWrap.scrollLeft = 0;
  }

  // init top tabs listeners
  topTabs.forEach(function (node) {
    node.addEventListener('click', function () {
      var idx = parseInt(node.getAttribute('data-tab-index'), 10) || 0;
      clearActiveTop();
      node.classList.add('active');
      renderItemsForTab(idx);
    });
  });

  // default: activate first
  if (topTabs.length) {
    topTabs[0].classList.add('active');
    renderItemsForTab(0);
  }
  
  // Re-check mobile status on resize
  window.addEventListener('resize', function() {
    var newIsMobile = window.matchMedia('(max-width: 900px)').matches;
    if (newIsMobile !== isMobile) {
      isMobile = newIsMobile;
      // Re-render current tab to update event listeners
      var activeTab = section.querySelector('.ct-top-tab.active');
      if (activeTab) {
        var idx = parseInt(activeTab.getAttribute('data-tab-index'), 10) || 0;
        renderItemsForTab(idx);
      }
    }
  });
});
