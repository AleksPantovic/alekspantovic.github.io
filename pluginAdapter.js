import { PluginAdapter } from 'https://cdn.jsdelivr.net/npm/@coyoapp/plugin-adapter/+esm';

export class PatchedPluginAdapter extends PluginAdapter {
  /**
   * Fetch the current Haiilo session token directly from Haiilo.
   */
  async getSessionToken() {
    const response = await fetch('https://asioso.coyocloud.com/web/authorization/token', {
      credentials: 'include'
    });
    if (response.ok) {
      const data = await response.json();
      return data.token;
    }
    throw new Error('[PatchedPluginAdapter] Could not fetch session token');
  }

  /**
   * Fetch users via your Netlify proxy, passing the session token.
   */
  async getUsers(sessionToken) {
    const res = await fetch('/.netlify/functions/get-users', {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('[PatchedPluginAdapter] getUsers() error:', res.status, text);
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return res.json();
  }
}

export async function initializePlugin() {
  const adapter = new PatchedPluginAdapter();
  const initResponse = await adapter.init();
  let backendFetchedUsers = null;
  let sessionToken = null;

  try {
    sessionToken = await adapter.getSessionToken();
    if (sessionToken) {
      backendFetchedUsers = await adapter.getUsers(sessionToken);
    }
  } catch (err) {
    console.error('[initializePlugin] Error fetching session token or users:', err);
  }

  return { adapter, initResponse, sessionToken, backendFetchedUsers };
}
