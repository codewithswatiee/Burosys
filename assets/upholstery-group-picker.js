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
    this.init();
  }

  init() {
    this.bindEvents();
    this.initializeDefaults();
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
    this.handleCloseDrawer = this.handleCloseDrawer.bind(this);
    this.handleTabSwitch = this.handleTabSwitch.bind(this);
    this.handleColorSelection = this.handleColorSelection.bind(this);
    this.handleDrawerContentClick = this.handleDrawerContentClick.bind(this);

    const openBtn = this.querySelector('[data-action="open-upholstery-drawer"]');
    if (openBtn) openBtn.addEventListener('click', this.handleOpenDrawer);

    // Bind events to the drawer itself since it might be moved to body
    if (this.drawer) {
      this.drawer.addEventListener('click', this.handleTabSwitch);
      this.drawer.addEventListener('change', this.handleColorSelection);
      
      const closeBtn = this.drawer.querySelector('[data-action="close-upholstery-drawer"]');
      if (closeBtn) closeBtn.addEventListener('click', this.handleCloseDrawer);

      const content = this.drawer.querySelector('.upholstery-drawer-content');
      if (content) content.addEventListener('click', this.handleDrawerContentClick);
    }
  }

  handleOpenDrawer(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    this.openDrawer();
  }

  handleCloseDrawer(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    this.closeDrawer();
  }

  handleTabSwitch(e) {
    if (e.target.matches('[data-upholstery-tab]')) {
      const tab = e.target;
      const tabId = tab.dataset.upholsteryTab;
      const groupName = tab.dataset.groupName;
      
      e.preventDefault();
      e.stopPropagation();
      console.log('Tab Switched:', { tabId, groupName });
      this.switchTab(tabId, groupName);
    }
  }

  handleColorSelection(e) {
    if (e.target.matches('input[name^="upholstery-color-"]')) {
      const input = e.target;
      const group = input.dataset.group;
      const color = input.dataset.color;
      const variantId = input.dataset.variantId;
      
      e.stopPropagation();
      console.log('Color Selected:', { group, color, variantId });
      this.selectColor(input, group, color, variantId);
    }
  }

  handleDrawerContentClick(e) {
    e.stopPropagation();
  }

  openDrawer() {
    if (!this.drawer) return;
    
    if (this.overflowTimeout) {
      clearTimeout(this.overflowTimeout);
      this.overflowTimeout = null;
    }

    this.restoreCurrentSelection();
    
    // Portal behavior: Move to body to avoid z-index/stacking context issues
    if (this.drawer.parentElement !== document.body) {
      this.placeholder = document.createComment('upholstery-drawer-placeholder');
      this.drawer.parentElement.insertBefore(this.placeholder, this.drawer);
      document.body.appendChild(this.drawer);
    }

    this.drawer.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    const firstFocusable = this.drawer.querySelector('button, input, [tabindex="0"]');
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }

  restoreCurrentSelection() {
    // Since drawer might be moved to body, we need to query from component root for method, but drawer for elements
    // Actually, updateSelectionDisplay updates inputs inside THIS component.
    // The visual state in drawer needs to be restored.
    
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

    this.drawer.classList.remove('active');
    document.body.style.overflow = 'auto';

    // Move back to placeholder if moved
    if (this.placeholder && this.placeholder.parentNode) {
       // Wait for transition end? Or move immediately?
       // Moving immediately removes transition effect potentially if elements are re-inserted.
       // Let's rely on CSS transition and just leave it in body until next open or destruction?
       // But if section is destroyed, we have a dangling element in body!
       // Ideally we move it back.
       
       this.placeholder.parentNode.insertBefore(this.drawer, this.placeholder);
       this.placeholder.parentNode.removeChild(this.placeholder);
       this.placeholder = null;
    }
    
    const triggerButton = this.querySelector('[data-action="open-upholstery-drawer"]');
    if (triggerButton) {
      triggerButton.focus();
    }
  }
  
  disconnectedCallback() {
      // Cleanup if removed from DOM
      if (this.placeholder && this.placeholder.parentNode && this.drawer && this.drawer.parentNode === document.body) {
          this.placeholder.parentNode.insertBefore(this.drawer, this.placeholder);
          this.placeholder.parentNode.removeChild(this.placeholder);
      } else if (this.drawer && this.drawer.parentNode === document.body) {
          // Just remove from body if placeholder is gone
          document.body.removeChild(this.drawer);
      }
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

    // Try to sync with variant picker first, but always apply variant directly as fallback
    if (colorOptionValueId || groupOptionValueId) {
      this.syncWithVariantPicker(groupOptionValueId, colorOptionValueId);
    }
    
    // Always ensure the variant is applied directly to guarantee URL and form updates
    this.applyVariantDirectly(variantId);
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
    }
  }
}

if (!customElements.get('upholstery-group-picker')) {
  customElements.define('upholstery-group-picker', UpholsteryGroupPicker);
}
