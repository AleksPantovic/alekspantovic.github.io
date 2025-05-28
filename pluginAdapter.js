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
    const responseData = await response.json();
    console.log('[PatchedPluginAdapter] Full Response from exchange-token.js:', responseData);
    const { sessionToken } = responseData;
    if (!sessionToken) {
      throw new Error('[PatchedPluginAdapter] No session token returned from exchange-token.js');
    }
    console.log('[PatchedPluginAdapter] Session Token obtained from exchange-token.js:', sessionToken);
    return sessionToken;
  }

  /**
   * Fetch users via the Haiilo API using adapter.fetch().
   */
  async getUsers(sessionToken) {
    try {
      // Optionally pass sessionToken if needed by backend
      const response = await this.fetch('GET', '/api/users', sessionToken ? { headers: { Authorization: `Bearer ${sessionToken}` } } : {});
      console.log('[PatchedPluginAdapter] Users fetched:', response);
      return response;
    } catch (error) {
      console.error('[PatchedPluginAdapter] getUsers() error:', error);
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }

  /**
   * Wrapper for adapter.fetch() to handle API requests via Haiilo Home.
   */
  async fetch(method, path, options = {}) {
    try {
      const response = await super.fetch(method, path, options);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[PatchedPluginAdapter] API error (${response.status}):`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      return response.json();
    } catch (error) {
      console.error('[PatchedPluginAdapter] fetch() failed:', error);
      throw error;
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

// Attach to window for browser usage
if (typeof window !== 'undefined') {
  window.PatchedPluginAdapter = PatchedPluginAdapter;
}
// Attach to module.exports for CommonJS-style eval usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports.PatchedPluginAdapter = PatchedPluginAdapter;
  module.exports.initializePlugin = initializePlugin;
}
