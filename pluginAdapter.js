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
   * Fetch users via the Haiilo API using the session token, but through your Netlify proxy function to avoid CORS.
   */
  async getUsers(sessionToken) {
    // Instead of calling Haiilo API directly, call your Netlify proxy function
    const response = await fetch('/.netlify/functions/fetch-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionToken }),
    });
    if (!response.ok) {
      const text = await response.text();
      console.error('[PatchedPluginAdapter] getUsers() error:', response.status, text);
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    return response.json();
  }

  /**
   * Fetch users via the Haiilo API using the JWT from adapter.init().
   * This method sends the JWT as a Bearer token in the Authorization header.
   */
  async getUsersWithInitToken() {
    // Get the JWT from adapter.init()
    const initResponse = this._initResponse || await this.init();
    const jwt = initResponse?.token;
    if (!jwt) {
      throw new Error('[PatchedPluginAdapter] No JWT token available from adapter.init().');
    }
    const response = await fetch('https://asioso.coyocloud.com/api/users', {
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const text = await response.text();
      console.error('[PatchedPluginAdapter] getUsersWithInitToken() error:', response.status, text);
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    return response.json();
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

// Call the function and log the result
initializePlugin().then(result => {
  console.log('[pluginAdapter.js] initializePlugin result:', result);
}).catch(err => {
  console.error('[pluginAdapter.js] initializePlugin error:', err);
});
