import { PluginAdapter } from 'https://cdn.jsdelivr.net/npm/@coyoapp/plugin-adapter/+esm';

export class PatchedPluginAdapter extends PluginAdapter {
  /**
   * Use the plugin adapter's built-in proxy to avoid CORS (no server access needed).
   * Example: await adapter.fetch('GET', '/api/users')
   */
  async getUsers() {
    // This will proxy the request via the parent Haiilo window, bypassing CORS
    return this.fetch('GET', '/api/users');
  }
}

export async function initializePlugin() {
  const adapter = new PatchedPluginAdapter();
  const initResponse = await adapter.init();
  const backendFetchedUsers = await adapter.getUsers();

  return { adapter, initResponse, backendFetchedUsers };
}
