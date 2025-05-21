import { PluginAdapter } from 'https://cdn.jsdelivr.net/npm/@coyoapp/plugin-adapter/+esm';

const HAIILO_SESSION_TOKEN_URL = 'https://asioso.coyocloud.com/web/authorization/token';
const PLUGIN_BACKEND_PROXY = '/.netlify/functions/haiilo-proxy';

export class PatchedPluginAdapter extends PluginAdapter {
  async getHaiiloSessionToken() {
    const res = await fetch(HAIILO_SESSION_TOKEN_URL, { credentials: 'include' });
    const { token } = await res.json();
    if (!token) throw new Error('No Haiilo session token returned');
    return token;
  }

  async proxyHaiiloRequest(endpoint) {
    const sessionToken = await this.getHaiiloSessionToken();
    const res = await fetch(PLUGIN_BACKEND_PROXY, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ endpoint })
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
    // Use the proxy to fetch users from Haiilo API
    return this.proxyHaiiloRequest('/api/users');
  }
}

export async function initializePlugin() {
  const adapter = new PatchedPluginAdapter();
  const initResponse = await adapter.initAndPatch();
  const backendFetchedUsers = await adapter.getUsers();
  return { adapter, initResponse, backendFetchedUsers };
}
