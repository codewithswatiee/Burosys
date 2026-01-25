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
      
      // Build hover box content with "Explore Now" link
      var hoverContent = '<div class="ct-hover-text">' + (it.content || '');
      if (it.link && !isMobile) {
        hoverContent += '<br><br><a href="' + it.link + '" class="ct-hover-link">Explore Now</a>';
      }
      hoverContent += '</div>';
      
      itemHoverBox.innerHTML = hoverContent;
      itemHoverBox.setAttribute('aria-hidden', 'true');

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

      // Mobile: click to navigate if link exists, Desktop: hover to show content
      if (isMobile) {
        if (it.link) {
          btn.addEventListener('click', function() {
            window.location.href = it.link;
          });
          btn.style.cursor = 'pointer';
        }
      } else {
        // Desktop: hover behavior
        btn.addEventListener('mouseenter', showHover);
        btn.addEventListener('mouseleave', hideHover);
        btn.addEventListener('focus', showHover);
        btn.addEventListener('blur', hideHover);
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
      exploreBtn.href = tab.link || '#';
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
