import { PluginAdapter } from 'https://cdn.jsdelivr.net/npm/@coyoapp/plugin-adapter/+esm';

const HAIILO_SESSION_TOKEN_URL = 'https://asioso.coyocloud.com/web/authorization/token';
const PLUGIN_BACKEND_USERS = '/.netlify/functions/get-users';

export class PatchedPluginAdapter extends PluginAdapter {
  // Only for plugin context, not for backend auth
  async initAndPatch() {
    this._initResponse = await this.init();
    return this._initResponse;
  }

  // Always use this for backend/API calls
  async getHaiiloSessionToken() {
    const res = await fetch(HAIILO_SESSION_TOKEN_URL, { credentials: 'include' });
    const { token } = await res.json();
    if (!token) throw new Error('No Haiilo session token returned');
    return token;
  }

  async getUsers() {
    const sessionToken = await this.getHaiiloSessionToken();

    const res = await fetch(PLUGIN_BACKEND_USERS, {
      headers: {
        Authorization: `Bearer ${sessionToken}`
      }
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Failed to fetch users: ${res.status} - ${text}`);
    }

    try {
      return JSON.parse(text);
    } catch (err) {
      console.error('Failed to parse JSON from get-users:', err);
      throw err;
    }
  }
}

export async function initializePlugin() {
  const adapter = new PatchedPluginAdapter();
  const initResponse = await adapter.initAndPatch(); // only for plugin context
  const backendFetchedUsers = await adapter.getUsers(); // uses correct session token

  return { adapter, initResponse, backendFetchedUsers };
}
