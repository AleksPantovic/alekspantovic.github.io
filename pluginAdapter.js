class PatchedPluginAdapter extends PluginAdapter {
  /**
   * Ensure credentials (cookies/session) are present before fetching the session token.
   * This can be done by first making a simple GET request to Haiilo (e.g. /web or /login)
   * with credentials: 'include' to establish the session, then fetch the token.
   */
  async ensureHaiiloSession() {
    // This request should set the necessary cookies if not already present.
    await fetch('https://asioso.coyocloud.com/web', { credentials: 'include', mode: 'cors' });
  }

  /**
   * Fetch the Haiilo session token directly from Haiilo using credentials: 'include'.
   * This will only work if CORS is allowed for your plugin origin.
   */
  async getSessionToken() {
    try {
      await this.ensureHaiiloSession();
      const response = await fetch('https://asioso.coyocloud.com/web/authorization/token', {
        credentials: 'include'
      });
      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Error fetching session token from Haiilo:', response.status, errorBody);
        throw new Error(`Failed to fetch session token: ${errorBody}`);
      }
      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Error fetching session token:', error);
      throw error;
    }
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

async function initializePlugin() {
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

// Attach to module.exports for CommonJS-style eval usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports.PatchedPluginAdapter = PatchedPluginAdapter;
  module.exports.initializePlugin = initializePlugin;
}
