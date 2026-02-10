/**
 * A custom element that manages the account login actions.
 *
 * @extends {HTMLElement}
 */
class AccountLoginActions extends HTMLElement {
  /**
   * @type {Element | null}
   */
  shopLoginButton = null;

  connectedCallback() {
    this.shopLoginButton = this.querySelector('shop-login-button');

    if (this.shopLoginButton) {
      // We don't have control over the shop-login-button markup, so we need to set additional attributes here
      this.shopLoginButton.setAttribute('full-width', 'true');
      this.shopLoginButton.setAttribute('persist-after-sign-in', 'true');
      // Do this only if New Customer Account is ALWAYS the sign in option (and never Classic Customer Account)
      this.shopLoginButton.setAttribute('analytics-context', 'loginWithShopSelfServe');
      this.shopLoginButton.setAttribute('flow-version', 'account-actions-popover');
      
      // Check if there's a resources page return URL stored
      const resourcesReturnUrl = sessionStorage.getItem('resourcesPageReturnUrl');
      if (resourcesReturnUrl) {
        this.shopLoginButton.setAttribute('return-uri', resourcesReturnUrl);
      } else {
        this.shopLoginButton.setAttribute('return-uri', window.location.href);
      }

      // Reload the page after the login is completed, otherwise the page state is incorrect
      this.shopLoginButton.addEventListener('completed', () => {
        // Check if we need to redirect to resources page
        const storedReturnUrl = sessionStorage.getItem('resourcesPageReturnUrl');
        if (storedReturnUrl) {
          sessionStorage.removeItem('resourcesPageReturnUrl');
          window.location.href = storedReturnUrl;
        } else {
          window.location.reload();
        }
      });
    }
  }
}

if (!customElements.get('account-login-actions')) {
  customElements.define('account-login-actions', AccountLoginActions);
}
