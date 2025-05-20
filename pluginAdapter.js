import { PluginAdapter } from '@coyoapp/plugin-adapter';
import axios from 'axios';

const PLUGIN_BACKEND_INIT = '/auth/init'; // Your backend endpoint to exchange the Haiilo init token
const PLUGIN_BACKEND_USERS = '/.netlify/functions/get-users'; // Use the correct Netlify function path

export class PatchedPluginAdapter extends PluginAdapter {
  async initAndPatch() {
    const initResponse = await this.init();
    this._initResponse = initResponse;
    return initResponse;
  }

  async getUsers() {
    if (!this._initResponse) {
      await this.initAndPatch();
    }
    const token = this._initResponse.token;
    console.log('[PatchedPluginAdapter] getUsers() using token:', token);
    try {
      const res = await fetch(PLUGIN_BACKEND_USERS, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const text = await res.text();
      console.log('[PatchedPluginAdapter] getUsers() raw response:', text);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('[PatchedPluginAdapter] getUsers() failed to parse JSON:', e);
        throw e;
      }
    } catch (err) {
      console.error('[PatchedPluginAdapter] getUsers() error:', err);
      throw err;
    }
  }
}

// Initialize the plugin adapter and send the init token to your backend
export async function initializePlugin() {
  try {
    console.log('[PluginAdapter] Initializing plugin adapter...');
    const adapter = new PatchedPluginAdapter();
    console.log('[PluginAdapter] Created PatchedPluginAdapter instance');
    const initResponse = await adapter.initAndPatch();
    console.log('[PluginAdapter] adapter.init() response:', initResponse);

    // Send the init token to your backend to get an API token
    console.log(`[PluginAdapter] Sending token to backend: ${PLUGIN_BACKEND_INIT}`, initResponse.token);
    const backendRes = await axios.post(PLUGIN_BACKEND_INIT, { token: initResponse.token });
    console.log('[PluginAdapter] Backend /auth/init response:', backendRes);

    // Fetch users from your backend proxy endpoint
    console.log(`[PluginAdapter] Fetching users from backend: ${PLUGIN_BACKEND_USERS}`);
    const usersRes = await adapter.getUsers();
    console.log('[PluginAdapter] Backend /.netlify/functions/get-users response:', usersRes);

    // Return all results, including users
    return {
      adapter,
      initResponse,
      backendAccessToken: backendRes.data,
      backendFetchedUsers: usersRes
    };
  } catch (err) {
    console.error('[PluginAdapter] Initialization Error:', err.message, err);
    throw err;
  }
}
