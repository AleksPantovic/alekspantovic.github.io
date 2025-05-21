import { PluginAdapter } from 'https://cdn.jsdelivr.net/npm/@coyoapp/plugin-adapter/+esm';

const PLUGIN_BACKEND_PROXY = '/.netlify/functions/haiilo-proxy';

export class PatchedPluginAdapter extends PluginAdapter {
  /**
   * Proxy any Haiilo API request through Netlify Function to avoid CORS.
   * @param {string} endpoint - The Haiilo API endpoint (e.g. '/api/users')
   * @param {object} options - { method, body, headers }
   * @returns {Promise<any>}
   */
  async proxyHaiiloRequest(endpoint, options = {}) {
    const res = await fetch(PLUGIN_BACKEND_PROXY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      body: JSON.stringify({
        endpoint,
        method: options.method || 'GET',
        body: options.body || null
      })
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Failed to proxy Haiilo request: ${res.status} - ${text}`);
    }
    try {
      return JSON.parse(text);
    } catch (err) {
      console.error('Failed to parse JSON from haiilo-proxy:', err);
      throw err;
    }
  }

  async getUsers() {
    // Always use the proxy to fetch users from Haiilo API
    return this.proxyHaiiloRequest('/api/users');
  }
}

export async function initializePlugin() {
  const adapter = new PatchedPluginAdapter();
  const initResponse = await adapter.init(); // Only for plugin context
  const backendFetchedUsers = await adapter.getUsers(); // Uses proxy, no CORS issues

  return { adapter, initResponse, backendFetchedUsers };
}
