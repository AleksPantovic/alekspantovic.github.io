import { PluginAdapter } from 'https://cdn.jsdelivr.net/npm/@coyoapp/plugin-adapter/+esm';

export class PatchedPluginAdapter extends PluginAdapter {
  /**
   * Fetch the current Haiilo session token via the parent window proxy.
   * Only works if the endpoint is exposed to plugins.
   */
  async getSessionToken() {
    const response = await this.fetch('GET', '/web/authorization/token');
    if (response && response.token) {
      return response.token;
    }
    throw new Error('[PatchedPluginAdapter] Could not fetch session token');
  }

  /**
   * Fetch users via your Netlify proxy, passing the session token.
   * This avoids CORS and works even if /api/users is not exposed to plugins.
   */
  async getUsers() {
    const sessionToken = await this.getSessionToken();
    const res = await fetch('/.netlify/functions/get-users', {
      headers: {
        Authorization: `Bearer ${sessionToken}`
      }
    });
    // Return the full response so the caller can check status and parse as needed
    return res;
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
