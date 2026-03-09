/**
 * Upholstery Group Picker Component
 * Handles the custom upholstery group selection with side drawer and tabs
 */

class UpholsteryGroupPicker extends HTMLElement {
  constructor() {
    super();
    this.overflowTimeout = null;
  }

  connectedCallback() {
    this.drawer = this.querySelector('[data-upholstery-drawer]');
    this._keepDrawerOpen = false;
    this.init();
    this.bindGlobalEvents();
    this._setupMorphDetection();
  }

  init() {
    this.bindEvents();
    this.initializeDefaults();
  }

  bindGlobalEvents() {
    // Bind methods for proper cleanup
    this.handleVariantChange = this.handleVariantChange.bind(this);
    this.handleVariantPickerChange = this.handleVariantPickerChange.bind(this);
    
    // Listen for variant changes from other sources
    document.addEventListener('variant:change', this.handleVariantChange);
    document.addEventListener('variant-picker:change', this.handleVariantPickerChange);
  }

  handleVariantChange(e) {
    if (e.detail.source !== 'upholstery-picker') {
      this.syncWithExternalVariantChange(e.detail.variantId);
    }
  }

  handleVariantPickerChange(e) {
    this.syncWithExternalVariantChange(e.detail?.variant?.id);
  }

  syncWithExternalVariantChange(variantId) {
    if (!variantId || !this.drawer) return;
    
    const drawerMediaGallery = this.drawer.querySelector('media-gallery');
    if (drawerMediaGallery) {
      const section = this.closest('.shopify-section, featured-product-information, dialog') || document.body;
      this.updateMediaGallery(variantId, section);
    }
  }

  initializeDefaults() {
    // Get current values from hidden inputs
    const groupInput = this.querySelector('[data-upholstery-group-input]');
    const colorInput = this.querySelector('[data-upholstery-color-input]');
    
    let selectedGroup = groupInput ? groupInput.value : null;
    let selectedColor = colorInput ? colorInput.value : null;
    
    // If no group is pre-selected, get the first active tab
    if (!selectedGroup) {
      const activeTab = this.querySelector('.upholstery-tab--active');
      if (activeTab) {
        selectedGroup = activeTab.dataset.groupName;
      }
    }
    
    if (selectedGroup) {
      const targetTab = this.querySelector(`[data-group-name="${selectedGroup}"]`);
      if (targetTab) {
        const tabId = targetTab.dataset.upholsteryTab;
        
        // Update tab states
        const tabs = this.querySelectorAll('[data-upholstery-tab]');
        tabs.forEach(tab => {
          tab.classList.toggle('upholstery-tab--active', tab === targetTab);
        });
        
        // Update panel states
        const panels = this.querySelectorAll('[data-upholstery-panel]');
        panels.forEach(panel => {
          panel.classList.toggle('upholstery-panel--active', panel.dataset.upholsteryPanel === tabId);
        });
        
        // Find the active panel and handle color selection
        const activePanel = this.querySelector(`[data-upholstery-panel="${tabId}"]`);
        if (activePanel) {
          let targetColorInput = null;
          
          if (selectedColor) {
            targetColorInput = activePanel.querySelector(`input[data-group="${selectedGroup}"][data-color="${selectedColor}"]`);
          }
          
          if (!targetColorInput) {
            targetColorInput = activePanel.querySelector('input[name^="upholstery-color-"]:not(:disabled)');
          }
          
          if (targetColorInput) {
            targetColorInput.checked = true;
            const group = targetColorInput.dataset.group;
            const color = targetColorInput.dataset.color;
            const variantId = targetColorInput.dataset.variantId;
            // Just update internal state, don't trigger variant picker update yet (infinite loop risk)
            // But we might need to display it?
            this.updateSelectionDisplay(this, group, color);
          }
        }
      }
    }
  }

  bindEvents() {
    this.handleOpenDrawer = this.handleOpenDrawer.bind(this);
    this.handleDrawerClick = this.handleDrawerClick.bind(this);
    this.handleColorSelection = this.handleColorSelection.bind(this);

    const openBtn = this.querySelector('[data-action="open-upholstery-drawer"]');
    if (openBtn) openBtn.addEventListener('click', this.handleOpenDrawer);

    // Use event delegation on drawer for all click interactions (morph-safe)
    if (this.drawer) {
      this.drawer.addEventListener('click', this.handleDrawerClick);
      this.drawer.addEventListener('change', this.handleColorSelection);
    }
  }

  handleOpenDrawer(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    this.openDrawer();
  }

  handleDrawerClick(e) {
    // Close button
    if (e.target.closest('[data-action="close-upholstery-drawer"]')) {
      e.preventDefault();
      e.stopPropagation();
      this.closeDrawer();
      return;
    }

    // Overlay click (close drawer)
    if (e.target.closest('.upholstery-drawer-overlay') && !e.target.closest('.upholstery-drawer-content')) {
      e.preventDefault();
      e.stopPropagation();
      this.closeDrawer();
      return;
    }

    // Tab switch
    const tab = e.target.closest('[data-upholstery-tab]');
    if (tab) {
      e.preventDefault();
      e.stopPropagation();
      this.switchTab(tab.dataset.upholsteryTab, tab.dataset.groupName);
      return;
    }

    // Prevent drawer content clicks from bubbling (for non-interactive elements)
    if (e.target.closest('.upholstery-drawer-content') && !e.target.matches('button, input, label, [role="button"]')) {
      e.stopPropagation();
    }
  }

  handleColorSelection(e) {
    if (e.target.matches('input[name^="upholstery-color-"]')) {
      const input = e.target;
      const group = input.dataset.group;
      const color = input.dataset.color;
      const variantId = input.dataset.variantId;
      
      e.stopPropagation();
      this.selectColor(input, group, color, variantId);
    }
  }

  openDrawer() {
    if (!this.drawer) return;
    
    if (this.overflowTimeout) {
      clearTimeout(this.overflowTimeout);
      this.overflowTimeout = null;
    }

    this.restoreCurrentSelection();

    // Portal to body to escape ancestor stacking contexts (transform/filter/opacity create new contexts)
    // This ensures the drawer appears above the site header regardless of z-index
    if (this.drawer.parentElement !== document.body) {
      this._drawerPlaceholder = document.createComment('upholstery-drawer-placeholder');
      this.drawer.parentElement.insertBefore(this._drawerPlaceholder, this.drawer);
      document.body.appendChild(this.drawer);
      // Re-bind event listeners after DOM move
      this.drawer.addEventListener('click', this.handleDrawerClick);
      this.drawer.addEventListener('change', this.handleColorSelection);
    }

    this.drawer.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Initialize media gallery in drawer if present
    this.initializeDrawerMediaGallery();
    
    const firstFocusable = this.drawer.querySelector('button, input, [tabindex="0"]');
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }

  initializeDrawerMediaGallery() {
    const mediaGallery = this.drawer ? this.drawer.querySelector('media-gallery') : null;
    if (mediaGallery) {
      // Trigger initialization if the gallery has an init method
      if (typeof mediaGallery.connectedCallback === 'function') {
        mediaGallery.connectedCallback();
      }
      
      // Sync with current variant selection
      const section = this.closest('.shopify-section, featured-product-information, dialog') || document.body;
      const variantInput = section.querySelector('[data-ref="variantId"], product-form [name="id"], form [name="id"]');
      if (variantInput && variantInput.value) {
        this.updateMediaGallery(variantInput.value, section);
      }
    }
  }

  restoreCurrentSelection() {
    const groupInput = this.querySelector('[data-upholstery-group-input]');
    const colorInput = this.querySelector('[data-upholstery-color-input]');
    
    if (!groupInput || !groupInput.value) return;
    
    const selectedGroup = groupInput.value;
    const selectedColor = colorInput ? colorInput.value : '';
    
    if (this.drawer) {
      const targetTab = this.drawer.querySelector(`[data-group-name="${selectedGroup}"]`);
      if (targetTab) {
        const tabId = targetTab.dataset.upholsteryTab;
        
        // Update tabs inside drawer
        this.drawer.querySelectorAll('[data-upholstery-tab]').forEach(t => {
          t.classList.toggle('upholstery-tab--active', t === targetTab);
        });

        // Update panels inside drawer
        this.drawer.querySelectorAll('[data-upholstery-panel]').forEach(panel => {
          panel.classList.toggle('upholstery-panel--active', panel.dataset.upholsteryPanel === tabId);
        });
        
        if (selectedColor) {
           const targetPanel = this.drawer.querySelector(`[data-upholstery-panel="${tabId}"]`);
           if (targetPanel) {
             const colorInputs = targetPanel.querySelectorAll('input[name^="upholstery-color-"]');
             colorInputs.forEach(input => input.checked = false);
             
             const targetColorInput = targetPanel.querySelector(`input[data-group="${selectedGroup}"][data-color="${selectedColor}"]`);
             if (targetColorInput) {
               targetColorInput.checked = true;
             }
           }
        }
      }
    }
  }

  closeDrawer() {
    if (!this.drawer) return;

    this._keepDrawerOpen = false;
    this.drawer.classList.remove('active');
    document.body.style.overflow = '';

    // Move drawer back to its original position in the component
    if (this._drawerPlaceholder && this._drawerPlaceholder.parentNode) {
      this._drawerPlaceholder.parentNode.insertBefore(this.drawer, this._drawerPlaceholder);
      this._drawerPlaceholder.parentNode.removeChild(this._drawerPlaceholder);
      this._drawerPlaceholder = null;
    }
    
    const triggerButton = this.querySelector('[data-action="open-upholstery-drawer"]');
    if (triggerButton) {
      triggerButton.focus();
    }
  }
  
  disconnectedCallback() {
      // Clean up morph observer
      if (this._morphObserver) {
          this._morphObserver.disconnect();
          this._morphObserver = null;
      }

      // Clean up drawer from body if it was portaled
      if (this.drawer && this.drawer.parentNode === document.body) {
          document.body.removeChild(this.drawer);
      }
      if (this._drawerPlaceholder && this._drawerPlaceholder.parentNode) {
          this._drawerPlaceholder.parentNode.removeChild(this._drawerPlaceholder);
      }
      
      // Clean up global listeners
      this.cleanupGlobalEvents();
  }

  cleanupGlobalEvents() {
    // Remove event listeners to prevent memory leaks
    document.removeEventListener('variant:change', this.handleVariantChange);
    document.removeEventListener('variant-picker:change', this.handleVariantPickerChange);
  }

  _setupMorphDetection() {
    // Observe DOM mutations to detect variant-picker morph updates.
    // When morph inserts a fresh drawer element, we swap it for the stale one in body.
    let rafId = null;

    this._morphObserver = new MutationObserver(() => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;

        // Check if morph inserted a new drawer in the component (while old one is in body)
        const freshDrawer = this.querySelector('[data-upholstery-drawer]');
        const oldDrawerInBody = this.drawer && this.drawer.parentNode === document.body;

        if (freshDrawer && oldDrawerInBody && freshDrawer !== this.drawer) {
          // Morph inserted a fresh drawer - swap it out
          // Remove the stale drawer from body
          document.body.removeChild(this.drawer);
          // Use the fresh drawer (has updated variant IDs)
          this.drawer = freshDrawer;

          if (this._keepDrawerOpen) {
            // Portal fresh drawer to body and re-open
            this._drawerPlaceholder = document.createComment('upholstery-drawer-placeholder');
            freshDrawer.parentElement.insertBefore(this._drawerPlaceholder, freshDrawer);
            document.body.appendChild(freshDrawer);
            freshDrawer.addEventListener('click', this.handleDrawerClick);
            freshDrawer.addEventListener('change', this.handleColorSelection);
            
            this.restoreCurrentSelection();
            freshDrawer.classList.add('active');
            document.body.style.overflow = 'hidden';
            this._keepDrawerOpen = false;
          }
        } else if (!oldDrawerInBody && this._keepDrawerOpen && this.drawer && !this.drawer.classList.contains('active')) {
          // Drawer wasn't in body (edge case), just re-open it
          this._keepDrawerOpen = false;
          this.restoreCurrentSelection();
          this.drawer.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      });
    });

    this._morphObserver.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
  }

  switchTab(tabId, groupName) {
    if (this.drawer) {
        const tabs = this.drawer.querySelectorAll('[data-upholstery-tab]');
        tabs.forEach(t => {
            t.classList.toggle('upholstery-tab--active', t.dataset.upholsteryTab === tabId);
        });

        const panels = this.drawer.querySelectorAll('[data-upholstery-panel]');
        panels.forEach(p => {
            p.classList.toggle('upholstery-panel--active', p.dataset.upholsteryPanel === tabId);
        });
    }

    const groupInput = this.querySelector('[data-upholstery-group-input]');
    if (groupInput) {
      groupInput.value = groupName;
      groupInput.dispatchEvent(new CustomEvent('upholstery-group-changed', {
        bubbles: true,
        detail: { optionName: 'Upholstery Group', optionValue: groupName }
      }));
    }

    let colorUpdated = false;
    if (this.drawer) {
        const currentPanel = this.drawer.querySelector(`[data-upholstery-panel="${tabId}"]`);
        if (currentPanel) {
        const checkedColor = currentPanel.querySelector('input[name^="upholstery-color-"]:checked');
        
        if (!checkedColor) {
            const firstColorInput = currentPanel.querySelector('input[name^="upholstery-color-"]:not(:disabled)');
            if (firstColorInput) {
            firstColorInput.checked = true;
            const group = firstColorInput.dataset.group;
            const color = firstColorInput.dataset.color;
            const variantId = firstColorInput.dataset.variantId;
            this.selectColor(firstColorInput, group, color, variantId);
            colorUpdated = true;
            }
        } else {
            const group = checkedColor.dataset.group;
            const color = checkedColor.dataset.color;
            const variantId = checkedColor.dataset.variantId;
            this.selectColor(checkedColor, group, color, variantId);
            colorUpdated = true;
        }
        }
    }

    if (!colorUpdated) {
        this.updateSelectionDisplay(this, groupName);
    }
  }

  selectColor(input, group, color, variantId) {
    this.updateSelectionDisplay(this, group, color);
    
    const colorInput = this.querySelector('[data-upholstery-color-input]');
    if (colorInput) {
      colorInput.value = color;
      colorInput.dispatchEvent(new CustomEvent('upholstery-color-changed', { bubbles: true }));
    }

    const colorOptionValueId = input.dataset.optionValueId;
    const activeTab = this.drawer ? this.drawer.querySelector('.upholstery-tab--active') : null;
    const groupOptionValueId = activeTab?.dataset.optionValueId;

    // Trigger variant-picker update for price, form, and availability integration
    const triggered = this.triggerVariantPickerUpdate(groupOptionValueId, colorOptionValueId, variantId);
    
    // Fallback: directly apply variant ID to form if variant-picker integration is unavailable
    if (!triggered) {
      this.applyVariantDirectly(variantId);
    }
  }

  triggerVariantPickerUpdate(groupOptionValueId, colorOptionValueId, variantId) {
    // Update hidden group fieldset radio
    const groupFieldset = this.querySelector('[data-upholstery-sync="group"]');
    if (groupFieldset && groupOptionValueId) {
      const allGroupRadios = groupFieldset.querySelectorAll('input[type="radio"]');
      allGroupRadios.forEach(r => {
        r.checked = false;
        r.dataset.currentChecked = 'false';
      });
      const targetGroupRadio = groupFieldset.querySelector(`input[data-option-value-id="${groupOptionValueId}"]`);
      if (targetGroupRadio) {
        targetGroupRadio.checked = true;
        targetGroupRadio.dataset.currentChecked = 'true';
      }
    }

    // Update hidden color fieldset radio
    let lastChangedRadio = null;
    const colorFieldset = this.querySelector('[data-upholstery-sync="color"]');
    if (colorFieldset && colorOptionValueId) {
      const allColorRadios = colorFieldset.querySelectorAll('input[type="radio"]');
      allColorRadios.forEach(r => {
        r.checked = false;
        r.dataset.currentChecked = 'false';
      });
      const targetColorRadio = colorFieldset.querySelector(`input[data-option-value-id="${colorOptionValueId}"]`);
      if (targetColorRadio) {
        targetColorRadio.checked = true;
        targetColorRadio.dataset.currentChecked = 'true';
        if (variantId) {
          targetColorRadio.dataset.variantId = variantId;
        }
        lastChangedRadio = targetColorRadio;
      }
    }

    // Dispatch change event from the radio (bubbles to variant-picker to trigger fetch + price update)
    const triggerRadio = lastChangedRadio || (groupFieldset ? groupFieldset.querySelector('input:checked') : null);
    if (triggerRadio) {
      // Save drawer state so morph detection can re-open after variant-picker morphs the section
      if (this.drawer && this.drawer.classList.contains('active')) {
        this._keepDrawerOpen = true;
      }
      triggerRadio.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    return false;
  }

  syncWithVariantPicker(groupOptionValueId, colorOptionValueId) {
    const section = this.closest('.shopify-section, featured-product-information, dialog') || document.body;
    const variantPicker = section.querySelector('variant-picker');
    if (!variantPicker) return;

    if (groupOptionValueId) {
      const groupRadio = variantPicker.querySelector(`[data-option-value-id="${groupOptionValueId}"]`);
      if (groupRadio instanceof HTMLInputElement && !groupRadio.checked) {
        groupRadio.checked = true;
      }
    }

    if (colorOptionValueId) {
      const colorRadio = variantPicker.querySelector(`[data-option-value-id="${colorOptionValueId}"]`);
      if (colorRadio instanceof HTMLInputElement) {
        colorRadio.checked = true;
        colorRadio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }

  applyVariantDirectly(variantId) {
    if (!variantId) return;
    const section = this.closest('.shopify-section, featured-product-information, dialog') || document.body;
    const variantInput = section.querySelector('[data-ref="variantId"], product-form [name="id"], form [name="id"]');
    if (variantInput) variantInput.value = variantId;

    if (window.location.pathname.includes('/products/')) {
      const url = new URL(window.location.href);
      url.searchParams.set('variant', variantId);
      history.replaceState({}, '', url.toString());
    }

    // Update media gallery to show variant-specific images
    this.updateMediaGallery(variantId, section);
  }

  updateMediaGallery(variantId, section) {
    // Update both main media gallery and drawer media gallery
    const mediaGalleries = [
      section.querySelector('media-gallery'),
      this.drawer ? this.drawer.querySelector('media-gallery') : null
    ].filter(Boolean);

    mediaGalleries.forEach(gallery => {
      if (gallery && typeof gallery.setActiveMedia === 'function') {
        // Find the first media item for this variant
        const variantMedia = gallery.querySelector(`[data-media-variant-id*="${variantId}"]`);
        if (variantMedia) {
          const mediaId = variantMedia.dataset.mediaId;
          if (mediaId) {
            gallery.setActiveMedia(mediaId);
          }
        }
      }
    });

    // Also trigger variant picker change event to update other components
    const variantPicker = section.querySelector('variant-picker');
    if (variantPicker && variantPicker.updateVariant) {
      variantPicker.updateVariant();
    }

    // Dispatch custom event for other components to listen to
    document.dispatchEvent(new CustomEvent('variant:change', {
      detail: { variantId, source: 'upholstery-picker' }
    }));
  }

  updateSelectionDisplay(picker, group, color = '') {
    const selectionText = picker.querySelector('[data-selection-text]');
    if (selectionText) {
      let displayText = group;
      if (color) displayText += ` | ${color}`;
      selectionText.textContent = displayText;
    }
    
    const groupInput = picker.querySelector('[data-upholstery-group-input]');
    if (groupInput) groupInput.value = group;
    
    if (color) {
      const colorHiddenInput = picker.querySelector('[data-upholstery-color-input]');
      if (colorHiddenInput) colorHiddenInput.value = color;
      
      // Update the placeholder circle with the selected color swatch
      this.updatePlaceholderSwatch(picker, group, color);
    }
  }

  updatePlaceholderSwatch(picker, group, color) {
    const placeholderCircle = picker.querySelector('.upholstery-placeholder-circle');
    if (!placeholderCircle) return;

    // Find the swatch from the selected color input's label in the drawer
    const drawer = this.drawer || picker.querySelector('[data-upholstery-drawer]');
    if (!drawer) return;

    const colorInput = drawer.querySelector(`input[data-group="${group}"][data-color="${color}"]`);
    if (!colorInput) return;

    const label = drawer.querySelector(`label[for="${colorInput.id}"]`);
    if (!label) return;

    const swatch = label.querySelector('.swatch');
    if (swatch) {
      // Clone the swatch and replace content in placeholder
      const clonedSwatch = swatch.cloneNode(true);
      placeholderCircle.innerHTML = '';
      placeholderCircle.appendChild(clonedSwatch);
    }
  }
}

if (!customElements.get('upholstery-group-picker')) {
  customElements.define('upholstery-group-picker', UpholsteryGroupPicker);
}
