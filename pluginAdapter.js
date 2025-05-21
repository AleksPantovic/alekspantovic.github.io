import { PluginAdapter } from 'https://cdn.jsdelivr.net/npm/@coyoapp/plugin-adapter/+esm';

const HAIILO_SESSION_TOKEN_URL = 'https://asioso.coyocloud.com/web/authorization/token';
const PLUGIN_BACKEND_USERS = '/.netlify/functions/get-users'; // User fetch

export class PatchedPluginAdapter extends PluginAdapter {
  async initAndPatch() {
    const initResponse = await this.init();
    this._initResponse = initResponse;
    return initResponse;
  }

  async getHaiiloSessionToken() {
    console.log('[PatchedPluginAdapter] Fetching Haiilo session token from:', HAIILO_SESSION_TOKEN_URL);
    const res = await fetch(HAIILO_SESSION_TOKEN_URL, { credentials: 'include' });
    const data = await res.json();
    // Extract the session token from the response
    let sessionToken = data.token || data.access_token || (typeof data === 'string' ? data : null);
    console.log('[PatchedPluginAdapter] Haiilo session token:', sessionToken);
    return sessionToken;
  }

  async getUsers() {
    // Always fetch the session token before fetching users
    const sessionToken = await this.getHaiiloSessionToken();
    console.log('[PatchedPluginAdapter] Fetching users with session token:', sessionToken);

    const res = await fetch(PLUGIN_BACKEND_USERS, {
      headers: {
        Authorization: `Bearer ${sessionToken}`
      }
    });

    const text = await res.text();
    console.log('[PatchedPluginAdapter] Raw response:', text);

    // Log status and content-type for debugging
    console.log('[PatchedPluginAdapter] Response status:', res.status);
    console.log('[PatchedPluginAdapter] Response content-type:', res.headers.get('content-type'));

    if (!res.ok) {
      console.error('[PatchedPluginAdapter] HTTP error:', res.status, text);
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    try {
      const data = JSON.parse(text);
      if (data && data.status && data.status !== 200 && data.response) {
        console.error('[PatchedPluginAdapter] Backend error:', data.response);
      }
      return data;
    } catch (e) {
      console.error('[PatchedPluginAdapter] Failed to parse JSON:', e, text);
      throw e;
    }
  }
}

export async function initializePlugin() {
  const adapter = new PatchedPluginAdapter();

  console.log('[PluginAdapter] Calling adapter.init()...');
  const initResponse = await adapter.initAndPatch();
  console.log('[PluginAdapter] Init response:', initResponse);

  // Step 1: Fetch users (getHaiiloSessionToken is called inside getUsers)
  const users = await adapter.getUsers();

  return {
    adapter,
    initResponse,
    backendFetchedUsers: users
  };
}
