import { PluginAdapter } from '@coyoapp/plugin-adapter';
import axios from 'axios';

const PLUGIN_BACKEND_INIT = '/auth/init'; // Your backend endpoint to exchange the Haiilo init token
const PLUGIN_BACKEND_FETCH = '/api/users'; // Your backend endpoint to fetch data from Haiilo API

// Add a getUsers method to PluginAdapter prototype if not present
if (!PluginAdapter.prototype.getUsers) {
  PluginAdapter.prototype.getUsers = async function () {
    // Use the token from the last init call, or re-init if needed
    if (!this._initResponse) {
      this._initResponse = await this.init();
    }
    const token = this._initResponse.token;
    // Fetch users from your backend proxy endpoint
    const res = await axios.get(PLUGIN_BACKEND_FETCH, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return res.data;
  };
}

// Initialize the plugin adapter and send the init token to your backend
export async function initializePlugin() {
  try {
    console.log('[PluginAdapter] Initializing plugin adapter...');
    const adapter = new PluginAdapter();
    const initResponse = await adapter.init();
    // Store initResponse for getUsers
    adapter._initResponse = initResponse;
    console.log('[PluginAdapter] adapter.init() response:', initResponse);

    // Send the init token to your backend to get an API token
    console.log(`[PluginAdapter] Sending token to backend: ${PLUGIN_BACKEND_INIT}`, initResponse.token);
    const backendRes = await axios.post(PLUGIN_BACKEND_INIT, { token: initResponse.token });
    console.log('[PluginAdapter] Backend /auth/init response:', backendRes);

    // Fetch data from your backend proxy endpoint (e.g., users)
    console.log(`[PluginAdapter] Fetching data from backend: ${PLUGIN_BACKEND_FETCH}`);
    const fetchRes = await axios.get(PLUGIN_BACKEND_FETCH, {
      headers: {
        Authorization: `Bearer ${initResponse.token}`
      }
    });
    console.log('[PluginAdapter] Backend /api/fetch response:', fetchRes);

    // Return both the adapter, backend token, and fetched data
    return {
      adapter,
      initResponse,
      backendAccessToken: backendRes.data,
      backendFetchedData: fetchRes.data
    };
  } catch (err) {
    console.error('Initialization Error:', err.message, err);
    throw err;
  }
}
