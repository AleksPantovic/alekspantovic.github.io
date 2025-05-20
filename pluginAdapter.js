import { PluginAdapter } from '@coyoapp/plugin-adapter';
import axios from 'axios';

const PLUGIN_BACKEND_INIT = '/auth/init'; // Your backend endpoint to exchange the Haiilo init token
const PLUGIN_BACKEND_USERS = '/api/users'; // Your backend endpoint to fetch users from Haiilo API

// Always add/override getUsers method to PluginAdapter prototype
PluginAdapter.prototype.getUsers = async function () {
  console.log('[PluginAdapter.getUsers] Called');
  // Use the token from the last init call, or re-init if needed
  if (!this._initResponse) {
    console.log('[PluginAdapter.getUsers] No _initResponse, calling init()');
    this._initResponse = await this.init();
  }
  const token = this._initResponse.token;
  console.log('[PluginAdapter.getUsers] Using token:', token);
  // Fetch users from your backend proxy endpoint
  try {
    console.log(`[PluginAdapter.getUsers] Fetching users from ${PLUGIN_BACKEND_USERS}`);
    const res = await axios.get(PLUGIN_BACKEND_USERS, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('[PluginAdapter.getUsers] Success:', res.data);
    return res.data;
  } catch (err) {
    console.error('[PluginAdapter.getUsers] Error:', err.message, err);
    throw err;
  }
};

// Initialize the plugin adapter and send the init token to your backend
export async function initializePlugin() {
  try {
    console.log('[PluginAdapter] Initializing plugin adapter...');
    const adapter = new PluginAdapter();
    console.log('[PluginAdapter] Created PluginAdapter instance');
    const initResponse = await adapter.init();
    // Store initResponse for getUsers
    adapter._initResponse = initResponse;
    console.log('[PluginAdapter] adapter.init() response:', initResponse);

    // Send the init token to your backend to get an API token
    console.log(`[PluginAdapter] Sending token to backend: ${PLUGIN_BACKEND_INIT}`, initResponse.token);
    const backendRes = await axios.post(PLUGIN_BACKEND_INIT, { token: initResponse.token });
    console.log('[PluginAdapter] Backend /auth/init response:', backendRes);

    // Fetch users from your backend proxy endpoint
    console.log(`[PluginAdapter] Fetching users from backend: ${PLUGIN_BACKEND_USERS}`);
    const usersRes = await axios.get(PLUGIN_BACKEND_USERS, {
      headers: {
        Authorization: `Bearer ${initResponse.token}`
      }
    });
    console.log('[PluginAdapter] Backend /api/users response:', usersRes);

    // Return both the adapter, backend token, and fetched users
    return {
      adapter,
      initResponse,
      backendAccessToken: backendRes.data,
      backendFetchedUsers: usersRes.data
    };
  } catch (err) {
    console.error('[PluginAdapter] Initialization Error:', err.message, err);
    throw err;
  }
}
