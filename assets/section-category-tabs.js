document.addEventListener('DOMContentLoaded', function () {
  var tabs = window.sectionCategoryTabs || [];
  if (!tabs.length) return;

  var section = document.querySelector('.category-tabs-section');
  if (!section) return;
  var topTabs = section.querySelectorAll('.ct-top-tab');
  var itemsWrap = section.querySelector('.ct-items');
  var imgLink = section.querySelector('.ct-image-link');
  var img = section.querySelector('.ct-image');

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
      btn.innerHTML = '<span class="ct-plus">+</span>' + it.title;

      var itemHoverBox = document.createElement('div');
      itemHoverBox.className = 'ct-hover-box';
      itemHoverBox.innerHTML = '<div class="ct-hover-text">' + (it.content || '') + '</div>';
      itemHoverBox.setAttribute('aria-hidden', 'true');

      function showHover() {
        itemHoverBox.classList.add('visible');
        itemHoverBox.setAttribute('aria-hidden', 'false');
      }

      function hideHover() {
        itemHoverBox.classList.remove('visible');
        itemHoverBox.setAttribute('aria-hidden', 'true');
      }

      btn.addEventListener('mouseenter', showHover);
      btn.addEventListener('mouseleave', hideHover);
      btn.addEventListener('focus', showHover);
      btn.addEventListener('blur', hideHover);

      wrapper.appendChild(btn);
      wrapper.appendChild(itemHoverBox);
      itemsWrap.appendChild(wrapper);
    });

    // update image + link
    img.src = tab.image || '';
    img.alt = tab.title || '';
    imgLink.href = tab.link || '#';
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
