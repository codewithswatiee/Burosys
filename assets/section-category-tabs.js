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

  function clearActiveTop() {
    topTabs.forEach(function (t) { t.classList.remove('active'); });
  }

  function renderItemsForTab(index) {
    var tab = tabs[index];
    itemsWrap.innerHTML = '';
    if (!tab) return;

    tab.items.forEach(function (it, i) {
      var wrapper = document.createElement('div');
      wrapper.className = 'ct-item-wrapper';

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ct-item-btn';
      btn.setAttribute('data-item-index', i);
      btn.textContent = it.title;

      // If item has a link, make button clickable to navigate
      if (it.link) {
        btn.addEventListener('click', function() {
          window.location.href = it.link;
        });
        btn.style.cursor = 'pointer';
      }

      wrapper.appendChild(btn);
      itemsWrap.appendChild(wrapper);
    });

    // update image + link
    img.src = tab.image || '';
    img.alt = tab.title || '';
    imgLink.href = tab.link || '#';
    
    // update explore now button
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
});
