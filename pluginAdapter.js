class PatchedPluginAdapter extends PluginAdapter {
  /**
   * Fetch the Haiilo session token via the OAuth flow.
   */
  async getSessionToken() {
    // Ensure adapter is initialized to have the init token
    const initResponse = this._initResponse || await this.init();
    const initToken = initResponse?.token;
    if (!initToken) {
      throw new Error('[PatchedPluginAdapter] Could not get init token.');
    }

    console.log('[PatchedPluginAdapter] Init Token:', initToken);

    // Exchange initToken for access token
    const tokenResponse = await fetch('https://asioso.coyocloud.com/api/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa('clientId:clientSecret')}`, // Replace with actual clientId and clientSecret
      },
      body: new URLSearchParams({
        grant_type: 'password',
        username: 'test@haiilo.com', // Replace with actual username
        password: 'secret', // Replace with actual password
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error('[PatchedPluginAdapter] Error fetching access token:', tokenResponse.status, errorBody);
      throw new Error(`Failed to fetch access token: ${errorBody}`);
    }

    const { access_token } = await tokenResponse.json();
    console.log('[PatchedPluginAdapter] Access Token:', access_token);

    return access_token;
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
