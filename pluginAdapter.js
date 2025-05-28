export class PatchedPluginAdapter extends PluginAdapter {
  /**
   * No manual session-token exchange needed for simple reads.
   * We rely on adapter.fetch() to proxy through Haiilo Home.
   */
  async getUsers() {
    try {
      // All calls to /api/users go via the built-in proxy
      const response = await this.fetch('GET', '/api/users');
      return response; // JSON parsed
    } catch (err) {
      console.error('[PatchedPluginAdapter] getUsers() error:', err);
      throw err;
    }
  }
}

// CommonJS export for eval usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports.PatchedPluginAdapter = PatchedPluginAdapter;
}

// Optionally, for browser global usage
window.PatchedPluginAdapter = PatchedPluginAdapter;

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
