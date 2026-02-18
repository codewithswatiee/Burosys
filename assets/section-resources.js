/**
 * Resources Section JavaScript
 * Handles filtering, tab switching, search, mobile interactions, and login checks
 */

(function() {
  'use strict';

  const section = document.querySelector('.resources-section');
  if (!section) return;

  // Login Status - Check if customer is logged in
  const isCustomerLoggedIn = section.dataset.customerLoggedIn === 'true';
  const loginUrl = section.dataset.loginUrl || '/account/login';
  const returnUrl = section.dataset.returnUrl || window.location.pathname;
  const fullReturnUrl = section.dataset.fullReturnUrl || window.location.href;

  // DOM Elements
  const filters = section.querySelector('.resources-filters');
  const tabs = section.querySelectorAll('.resources-tab');
  const tabContents = section.querySelectorAll('.resources-grid-wrapper');
  // Container for unified search results (created on init)
  let searchResultsWrapper = null;
  const searchInput = section.querySelector('#resources-search-input');
  const filterCheckboxes = section.querySelectorAll('.filter-option input');
  const filterGroupHeaders = section.querySelectorAll('.filter-group-header');
  const filterGroups = section.querySelectorAll('.filter-group[data-for-tab]');
  const mobileFilterToggle = section.querySelector('.mobile-filter-toggle');
  const noResults = section.querySelector('.no-results');

  // State
  let currentTab = 'catalogs';
  let activeFilters = {
    catalogs: [],
    files: [],
    ideas: []
  };
  let searchQuery = '';
  let sortBy = 'relevance';

  /**
   * Initialize the section
   */
  function init() {
    setupTabs();
    setupFilters();
    setupSearch();
    setupFilterGroupToggle();
    setupMobileFilter();
    setupLoginCheck();
    // Initialize filter visibility for default tab (catalogs)
    updateFilterVisibility(currentTab);
    applyFilters();
  }

  /**
   * Setup login check for resource downloads
   * Intercepts clicks on resource links and requires login before downloading
   */
  function setupLoginCheck() {
    const resourceLinks = section.querySelectorAll('.resource-card-link');
    
    resourceLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        if (!isCustomerLoggedIn) {
          e.preventDefault();
          e.stopPropagation();
          
          // Store the intended download URL for after login
          const downloadUrl = link.getAttribute('href');
          if (downloadUrl) {
            sessionStorage.setItem('pendingResourceDownload', downloadUrl);
          }
          
          // Store the resources page PATH to redirect back after login (avoid full origin)
          // Using a relative path prevents OAuth redirect_uri mismatches in preview domains
          sessionStorage.setItem('resourcesPageReturnUrl', returnUrl);
          
          // Redirect to login page with return URL
          const redirectUrl = `${loginUrl}`;
          window.location.href = redirectUrl;
        }
        // If logged in, allow normal link behavior (opens in new tab)
      });
    });
    
    // Check if there's a pending download after login
    checkPendingDownload();
  }
  
  /**
   * Check and handle pending resource download after login
   */
  function checkPendingDownload() {
    if (isCustomerLoggedIn) {
      const pendingDownload = sessionStorage.getItem('pendingResourceDownload');
      if (pendingDownload) {
        sessionStorage.removeItem('pendingResourceDownload');
        // Open the download in a new tab after a brief delay
        setTimeout(() => {
          window.open(pendingDownload, '_blank', 'noopener');
        }, 500);
      }
    }
  }

  /**
   * Setup tab switching
   */
  function setupTabs() {
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        switchTab(tabName);
      });
    });
  }

  /**
   * Switch to a specific tab
   * @param {string} tabName 
   */
  function switchTab(tabName) {
    currentTab = tabName;

    // Update tab buttons
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update tab content
    tabContents.forEach(content => {
      content.classList.toggle('hidden', content.dataset.tabContent !== tabName);
    });

    // Update filter group visibility based on active tab
    updateFilterVisibility(tabName);

    // Re-apply filters for new tab
    applyFilters();
  }

  /**
   * Show/hide filter groups based on active tab
   * - Catalogs tab: show only catalogs filter and sort
   * - Files tab: show only files filter and sort
   * - Ideas tab: show only ideas filter and sort
   * @param {string} tabName 
   */
  function updateFilterVisibility(tabName) {
    // Update data attribute on filters sidebar
    if (filters) {
      filters.dataset.activeTab = tabName;
    }

    // Show/hide filter groups based on which tabs they belong to
    filterGroups.forEach(group => {
      const forTabs = (group.dataset.forTab || '').split(',').map(t => t.trim());
      
      // Show filter group if it's meant for this tab
      const shouldShow = forTabs.includes(tabName);
      group.classList.toggle('hidden', !shouldShow);
    });
  }

  /**
   * Setup filter checkboxes
   */
  function setupFilters() {
    filterCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const filterType = checkbox.dataset.filterType;
        const value = checkbox.value;

        if (filterType === 'sort') {
          sortBy = value;
        } else if (checkbox.checked) {
          if (!activeFilters[filterType]) {
            activeFilters[filterType] = [];
          }
          if (!activeFilters[filterType].includes(value)) {
            activeFilters[filterType].push(value);
          }
        } else {
          if (activeFilters[filterType]) {
            const index = activeFilters[filterType].indexOf(value);
            if (index > -1) {
              activeFilters[filterType].splice(index, 1);
            }
          }
        }

        applyFilters();
      });
    });
  }

  /**
   * Setup search functionality
   */
  function setupSearch() {
    if (!searchInput) return;

    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        searchQuery = e.target.value.toLowerCase().trim();
        // Ensure the unified search results container exists
        ensureSearchResultsContainer();
        applyFilters();
      }, 300);
    });
  }

  /**
   * Ensure a container exists for displaying combined search results
   */
  function ensureSearchResultsContainer() {
    const contentArea = section.querySelector('.resources-content');
    if (!contentArea) return;
    if (!searchResultsWrapper) {
      searchResultsWrapper = document.createElement('div');
      searchResultsWrapper.className = 'search-results-wrapper hidden';
      searchResultsWrapper.innerHTML = '<div class="resources-grid"></div>';
      // Insert search results before the first tab content
      const firstTabContent = contentArea.querySelector('[data-tab-content]');
      if (firstTabContent) contentArea.insertBefore(searchResultsWrapper, firstTabContent);
      else contentArea.appendChild(searchResultsWrapper);
    }
  }

  /**
   * Clear search results content
   */
  function clearSearchResults() {
    if (!searchResultsWrapper) return;
    const grid = searchResultsWrapper.querySelector('.resources-grid');
    if (grid) grid.innerHTML = '';
  }

  /**
   * Setup filter group collapse/expand
   */
  function setupFilterGroupToggle() {
    filterGroupHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const group = header.closest('.filter-group');
        const isCollapsed = group.classList.contains('collapsed');
        const toggle = header.querySelector('.filter-toggle');

        group.classList.toggle('collapsed');
        header.setAttribute('aria-expanded', isCollapsed ? 'true' : 'false');
        toggle.textContent = isCollapsed ? '−' : '+';
      });
    });
  }

  /**
   * Setup mobile filter panel
   */
  function setupMobileFilter() {
    if (!mobileFilterToggle) return;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'filter-overlay';
    section.appendChild(overlay);

    // Create close button for filters
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'mobile-filter-close';
    closeBtn.setAttribute('aria-label', 'Close filters');
    closeBtn.innerHTML = '&times;';
    // prepend to filters so it's visible at top-right
    filters.prepend(closeBtn);

    // Toggle filter panel
    mobileFilterToggle.addEventListener('click', () => {
      filters.classList.add('active');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    // Close filter panel
    const closeFilters = () => {
      filters.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    };
    closeBtn.addEventListener('click', closeFilters);
    overlay.addEventListener('click', closeFilters);
  }

  /**
   * Apply all active filters, search, and sort
   */
  function applyFilters() {
    // If there's a search query, search across all tabs and show combined results
    if (searchQuery) {
      ensureSearchResultsContainer();
      clearSearchResults();
      const resultsGrid = searchResultsWrapper.querySelector('.resources-grid');
      let totalVisible = 0;

      // Iterate all cards in all tabContents
      tabContents.forEach(content => {
        const tabName = content.dataset.tabContent;
        const cards = content.querySelectorAll('.resource-card');

        // Determine filters relevant for this tab
        let filterType;
        switch (tabName) {
          case 'catalogs': filterType = 'catalogs'; break;
          case 'files': filterType = 'files'; break;
          case 'ideas': filterType = 'ideas'; break;
          default: filterType = null; break;
        }

        const currentFilters = filterType ? (activeFilters[filterType] || []) : [];

        cards.forEach(card => {
          const cardFilters = (card.dataset.filters || '').toLowerCase().split(',').map(f => f.trim());
          const cardName = (card.dataset.name || '').toLowerCase();

          // Filter match per card using its tab's filters
          let filterMatch = true;
          if (currentFilters.length > 0) {
            filterMatch = currentFilters.some(filter => {
              return cardFilters.some(cardFilter => cardFilter.includes(filter));
            });
          }

          // Search match
          let searchMatch = cardName.includes(searchQuery) || cardFilters.some(f => f.includes(searchQuery));

          if (filterMatch && searchMatch) {
            totalVisible++;
            // Clone the card so original layout stays intact
            const clone = card.cloneNode(true);
            resultsGrid.appendChild(clone);
          }
        });
      });

      // Show search results wrapper and hide the normal tab contents
      searchResultsWrapper.classList.toggle('hidden', totalVisible === 0);
      tabContents.forEach(c => c.classList.add('hidden'));

      // Show/hide no results message
      if (noResults) {
        noResults.classList.toggle('hidden', totalVisible > 0);
      }

      // If sorting by name, sort the combined results
      if (sortBy === 'name' && resultsGrid) {
        const cards = Array.from(resultsGrid.querySelectorAll('.resource-card'));
        cards.sort((a, b) => {
          const nameA = (a.dataset.name || '').toLowerCase();
          const nameB = (b.dataset.name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
        cards.forEach(card => resultsGrid.appendChild(card));
      }

      return;
    }

    // No search query: revert to normal single-tab behavior
    if (searchResultsWrapper) {
      searchResultsWrapper.classList.add('hidden');
      clearSearchResults();
    }

    // Ensure the active tab content is visible again (search previously hid all tabs)
    tabContents.forEach(content => {
      content.classList.toggle('hidden', content.dataset.tabContent !== currentTab);
    });

    const activeContent = section.querySelector(`[data-tab-content="${currentTab}"]`);
    if (!activeContent) return;

    const cards = activeContent.querySelectorAll('.resource-card');
    let visibleCount = 0;

    // Get current filter type based on tab
    let filterType;
    switch (currentTab) {
      case 'catalogs':
        filterType = 'catalogs';
        break;
      case 'files':
        filterType = 'files';
        break;
      case 'ideas':
        filterType = 'ideas';
        break;
    }

    const currentFilters = activeFilters[filterType] || [];

    cards.forEach(card => {
      const cardFilters = (card.dataset.filters || '').toLowerCase().split(',').map(f => f.trim());
      const cardName = (card.dataset.name || '').toLowerCase();

      // Check filter match
      let filterMatch = true;
      if (currentFilters.length > 0) {
        filterMatch = currentFilters.some(filter => {
          return cardFilters.some(cardFilter => cardFilter.includes(filter));
        });
      }

      // Check search match
      let searchMatch = true;
      if (searchQuery) {
        searchMatch = cardName.includes(searchQuery) || 
                      cardFilters.some(f => f.includes(searchQuery));
      }

      // Show/hide card
      if (filterMatch && searchMatch) {
        card.classList.remove('hidden');
        visibleCount++;
      } else {
        card.classList.add('hidden');
      }
    });

    // Show/hide no results message
    if (noResults) {
      noResults.classList.toggle('hidden', visibleCount > 0);
    }

    // Sort cards if needed
    if (sortBy === 'name') {
      sortCards(activeContent);
    }
  }

  /**
   * Sort cards alphabetically by name
   * @param {HTMLElement} container 
   */
  function sortCards(container) {
    const grid = container.querySelector('.resources-grid');
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll('.resource-card'));
    
    cards.sort((a, b) => {
      const nameA = (a.dataset.name || '').toLowerCase();
      const nameB = (b.dataset.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

    cards.forEach(card => grid.appendChild(card));
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* =========================================================
   *  Idea Starter Gallery Modal
   * ========================================================= */
  const galleryModal = document.getElementById('idea-gallery-modal');
  let galleryImages = [];
  let galleryIndex = 0;

  function openGalleryModal(card) {
    if (!galleryModal) return;

    const raw = card.dataset.galleryImages || '';
    galleryImages = raw.split('|||').filter(Boolean);
    galleryIndex = 0;

    if (galleryImages.length === 0) return;

    // Set project name
    const projectName = card.dataset.projectName || '';
    const nameEl = galleryModal.querySelector('.idea-gallery-project-name');
    if (nameEl) nameEl.textContent = projectName;

    // Build credits
    const creditsContainer = galleryModal.querySelector('.idea-gallery-credits');
    if (creditsContainer) {
      creditsContainer.innerHTML = '';
      const creditsRaw = card.dataset.credits || '';
      if (creditsRaw) {
        const creditPairs = creditsRaw.split('|||').filter(Boolean);
        creditPairs.forEach(pair => {
          const parts = pair.split(':::');
          const label = parts[0] || '';
          const text = parts[1] || '';
          if (label) {
            const block = document.createElement('div');
            block.className = 'idea-gallery-credit-block';
            block.innerHTML = '<span class="idea-gallery-credit-label">' + label + '</span>' +
                              '<p class="idea-gallery-credit-text">' + text + '</p>';
            creditsContainer.appendChild(block);
          }
        });
      }
    }

    // Show/hide nav arrows
    updateGalleryNav();

    // Show first image
    updateGalleryImage();

    // Open modal
    galleryModal.setAttribute('aria-hidden', 'false');
    galleryModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeGalleryModal() {
    if (!galleryModal) return;
    galleryModal.setAttribute('aria-hidden', 'true');
    galleryModal.classList.remove('active');
    document.body.style.overflow = '';
    galleryImages = [];
    galleryIndex = 0;
  }

  function updateGalleryImage() {
    const img = galleryModal.querySelector('.idea-gallery-main-img');
    if (img && galleryImages[galleryIndex]) {
      img.src = galleryImages[galleryIndex];
    }
    updateGalleryNav();
  }

  function updateGalleryNav() {
    const prev = galleryModal.querySelector('.idea-gallery-prev');
    const next = galleryModal.querySelector('.idea-gallery-next');
    if (prev) prev.style.visibility = galleryIndex > 0 ? 'visible' : 'hidden';
    if (next) next.style.visibility = galleryIndex < galleryImages.length - 1 ? 'visible' : 'hidden';

    // Hide nav entirely if only 1 image
    const nav = galleryModal.querySelector('.idea-gallery-nav');
    if (nav) nav.style.display = galleryImages.length <= 1 ? 'none' : 'flex';
  }

  function setupGalleryModal() {
    if (!galleryModal) return;

    // Close button
    const closeBtn = galleryModal.querySelector('.idea-gallery-close');
    if (closeBtn) closeBtn.addEventListener('click', closeGalleryModal);

    // Prev / Next
    const prevBtn = galleryModal.querySelector('.idea-gallery-prev');
    const nextBtn = galleryModal.querySelector('.idea-gallery-next');
    if (prevBtn) prevBtn.addEventListener('click', () => {
      if (galleryIndex > 0) { galleryIndex--; updateGalleryImage(); }
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
      if (galleryIndex < galleryImages.length - 1) { galleryIndex++; updateGalleryImage(); }
    });

    // Click outside sidebar to close
    galleryModal.addEventListener('click', (e) => {
      if (e.target === galleryModal) closeGalleryModal();
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!galleryModal.classList.contains('active')) return;
      if (e.key === 'Escape') closeGalleryModal();
      if (e.key === 'ArrowLeft' && galleryIndex > 0) { galleryIndex--; updateGalleryImage(); }
      if (e.key === 'ArrowRight' && galleryIndex < galleryImages.length - 1) { galleryIndex++; updateGalleryImage(); }
    });

    // Delegate click on gallery trigger buttons
    section.addEventListener('click', (e) => {
      const trigger = e.target.closest('.idea-gallery-trigger');
      if (!trigger) return;
      const card = trigger.closest('.idea-gallery-card');
      if (card) openGalleryModal(card);
    });
  }

  // Init gallery modal when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupGalleryModal);
  } else {
    setupGalleryModal();
  }

})();
