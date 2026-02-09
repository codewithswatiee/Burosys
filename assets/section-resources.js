/**
 * Resources Section JavaScript
 * Handles filtering, tab switching, search, and mobile interactions
 */

(function() {
  'use strict';

  const section = document.querySelector('.resources-section');
  if (!section) return;

  // DOM Elements
  const filters = section.querySelector('.resources-filters');
  const tabs = section.querySelectorAll('.resources-tab');
  const tabContents = section.querySelectorAll('.resources-grid-wrapper');
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
    // Initialize filter visibility for default tab (catalogs)
    updateFilterVisibility(currentTab);
    applyFilters();
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
        applyFilters();
      }, 300);
    });
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
})();
