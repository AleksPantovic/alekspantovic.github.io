class PatchedPluginAdapter extends PluginAdapter {
  /**
   * Fetch the current Haiilo session token via your Netlify backend proxy to avoid CORS.
   */
  async getSessionToken() {
    // Call your Netlify proxy function to fetch the session token server-side
    const res = await fetch('/.netlify/functions/get-session-token');
    if (res.ok) {
      const data = await res.json();
      return data.token;
    }
    throw new Error('[PatchedPluginAdapter] Could not fetch session token via backend proxy');
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
