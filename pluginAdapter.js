class PatchedPluginAdapter extends PluginAdapter {
  /**
   * Fetch the Haiilo session token directly from Haiilo using credentials: 'include'.
   * WARNING: This will only work if CORS is allowed for your plugin origin.
   */
  async getSessionTokenDirect() {
    const response = await fetch('https://asioso.coyocloud.com/web/authorization/token', {
      credentials: 'include'
    });
    if (response.ok) {
      const data = await response.json();
      return data.token;
    }
    throw new Error('[PatchedPluginAdapter] Could not fetch session token (direct)');
  }

  /**
   * Fetch the Haiilo session token via your Netlify backend proxy (exchange-token).
   */
  async getSessionToken() {
    // Ensure adapter is initialized to have the init token
    const initResponse = this._initResponse || await this.init();
    const initToken = initResponse?.token;
    if (!initToken) {
      throw new Error('[PatchedPluginAdapter] Could not get init token.');
    }

    const response = await fetch('/.netlify/functions/exchange-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${initToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[PatchedPluginAdapter] Error from exchange-token:', response.status, errorBody);
      throw new Error(`Failed to exchange token: ${errorBody}`);
    }

    const data = await response.json();
    return data.accessToken; // The session token from the backend
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

  /**
   * Test direct call to /api/users with the session token (for debugging only).
   * This will likely fail due to CORS if called from the browser.
   */
  async testDirectHaiiloApiCall(sessionToken) {
    try {
      const res = await fetch('https://asioso.coyocloud.com/api/users', {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      const text = await res.text();
      if (!res.ok) {
        console.error('[PatchedPluginAdapter] Direct /api/users error:', res.status, text);
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch (err) {
      console.error('[PatchedPluginAdapter] Direct /api/users fetch failed:', err);
      return null;
    }
  }

  /**
   * Test direct call to /api/users with the session token (for debugging only).
   * This will likely fail due to CORS if called from the browser.
   */
  async testDirectHaiiloApiCallWithDirectSessionToken() {
    try {
      const sessionToken = await this.getSessionTokenDirect();
      const res = await fetch('https://asioso.coyocloud.com/api/users', {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      const text = await res.text();
      if (!res.ok) {
        console.error('[PatchedPluginAdapter] Direct /api/users error:', res.status, text);
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch (err) {
      console.error('[PatchedPluginAdapter] Direct /api/users fetch failed:', err);
      return null;
    }
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
