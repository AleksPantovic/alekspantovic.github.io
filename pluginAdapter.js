class PatchedPluginAdapter extends PluginAdapter {
  /**
   * Fetch the Haiilo session token via the Netlify backend proxy to avoid CORS issues.
   */
  async getSessionToken() {
    try {
      const response = await fetch('/.netlify/functions/get-session-token');
      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Error fetching session token from Netlify proxy:', response.status, errorBody);
        throw new Error(`Failed to fetch session token from proxy: ${errorBody}`);
      }
      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Error fetching session token from proxy:', error);
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
