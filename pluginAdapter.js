import { PluginAdapter } from 'https://cdn.jsdelivr.net/npm/@coyoapp/plugin-adapter/+esm';

export class PatchedPluginAdapter extends PluginAdapter {
  /**
   * Fetch the current Haiilo session token via the parent window proxy.
   * Only works if the endpoint is exposed to plugins.
   */
  async getSessionToken() {
    // This will proxy the request via the parent Haiilo window, bypassing CORS
    const response = await this.fetch('GET', '/web/authorization/token');
    if (response && response.token) {
      return response.token;
    }
    throw new Error('[PatchedPluginAdapter] Could not fetch session token');
  }

  /**
   * Use the plugin adapter's built-in proxy to avoid CORS (no server access needed).
   * This will only work for endpoints that Haiilo exposes to plugins via the parent window.
   */
  async getUsers() {
    // Use the built-in proxy, but handle error responses
    const response = await this.fetch('GET', '/api/users');
    if (response && response.status && response.status !== 200) {
      // Log backend error details if present
      console.error('[PatchedPluginAdapter] Backend error:', response.response || response);
      throw new Error(
        `Haiilo API error: ${response.status} - ${JSON.stringify(response.response || response)}`
      );
    }
    return response;
  }
}

export async function initializePlugin() {
  const adapter = new PatchedPluginAdapter();
  const initResponse = await adapter.init();
  let backendFetchedUsers;
  let sessionToken;
  try {
    sessionToken = await adapter.getSessionToken();
    backendFetchedUsers = await adapter.getUsers();
  } catch (err) {
    console.error('[initializePlugin] Failed to fetch users or token:', err);
    backendFetchedUsers = null;
    sessionToken = null;
  }
  return { adapter, initResponse, sessionToken, backendFetchedUsers };
}
