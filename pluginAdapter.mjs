import { PluginAdapter } from 'https://cdn.jsdelivr.net/npm/@coyoapp/plugin-adapter/+esm';

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
