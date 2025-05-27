class PatchedPluginAdapter extends PluginAdapter {
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

    console.log('[PatchedPluginAdapter] Init Token:', initToken);

    // Call the Netlify function to exchange the init token for a session token
    const response = await fetch('/.netlify/functions/exchange-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ initToken }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[PatchedPluginAdapter] Error from exchange-token:', response.status, errorBody);
      throw new Error(`Failed to exchange token: ${errorBody}`);
    }

    const responseData = await response.json();
    console.log('[PatchedPluginAdapter] Full Response from exchange-token.js:', responseData);

    const { sessionToken } = responseData;
    console.log('[PatchedPluginAdapter] Session Token obtained from exchange-token.js:', sessionToken);

    if (!sessionToken) {
      throw new Error('[PatchedPluginAdapter] No session token returned from exchange-token.js');
    }

    return sessionToken;
  }

  /**
   * Fetch users via the Haiilo API using the session token.
   */
  async getUsers(sessionToken) {
    const res = await fetch('https://asioso.coyocloud.com/api/users', {
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
