import { PluginAdapter } from 'https://cdn.jsdelivr.net/npm/@coyoapp/plugin-adapter/+esm';

export class PatchedPluginAdapter extends PluginAdapter {
  /**
   * Get the plugin init token (for plugin context).
   */
  async getInitToken() {
    if (!this._initResponse) {
      this._initResponse = await this.init();
    }
    return this._initResponse.token;
  }

  /**
   * Exchange the init token for a backend API token via your Netlify function.
   * Assumes your Netlify function implements the token exchange logic.
   */
  async exchangeTokenForBackendToken() {
    const initToken = await this.getInitToken();
    const res = await fetch('/.netlify/functions/exchange-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${initToken}`,
        'Content-Type': 'application/json'
      }
      // Optionally, include pluginId or other context in the body if needed
      // body: JSON.stringify({ pluginId: 'YOUR_PLUGIN_ID' })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`[PatchedPluginAdapter] Token exchange failed: ${res.status} - ${text}`);
    }
    const data = await res.json();
    if (!data.accessToken) throw new Error('[PatchedPluginAdapter] No backend access token returned');
    return data.accessToken;
  }

  /**
   * Fetch users via your Netlify proxy, using the backend API token.
   */
  async getUsers() {
    const backendToken = await this.exchangeTokenForBackendToken();
    const res = await fetch('/.netlify/functions/get-users', {
      headers: {
        Authorization: `Bearer ${backendToken}`
      }
    });
    return res;
  }
}

export async function initializePlugin() {
  const adapter = new PatchedPluginAdapter();
  const initResponse = await adapter.init();
  let backendFetchedUsers;
  let backendToken;
  try {
    backendToken = await adapter.exchangeTokenForBackendToken();
    backendFetchedUsers = await adapter.getUsers();
  } catch (err) {
    console.error('[initializePlugin] Failed to fetch users or token:', err);
    backendFetchedUsers = null;
    backendToken = null;
  }
  return { adapter, initResponse, backendToken, backendFetchedUsers };
}
