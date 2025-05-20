import { PluginAdapter } from '@coyoapp/plugin-adapter';
import axios from 'axios';

const PLUGIN_BACKEND_INIT = '/auth/init'; // Your backend endpoint to exchange the Haiilo init token
const PLUGIN_BACKEND_USERS = '/api/users'; // Your backend endpoint to fetch users from Haiilo API

// Initialize the plugin adapter and send the init token to your backend
export async function initializePlugin() {
  try {
    console.log('[PluginAdapter] Initializing plugin adapter...');
    const adapter = new PluginAdapter();
    console.log('[PluginAdapter] Created PluginAdapter instance');
    const initResponse = await adapter.init();
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

    // Return all results, including users
    return {
      adapter,
      initResponse,
      backendAccessToken: backendRes.data,
      backendFetchedUsers: usersRes.data,
      getUsers: async () => {
        console.log('[PluginAdapter] getUsers() called from init result');
        const res = await axios.get(PLUGIN_BACKEND_USERS, {
          headers: {
            Authorization: `Bearer ${initResponse.token}`
          }
        });
        return res.data;
      }
    };
  } catch (err) {
    console.error('[PluginAdapter] Initialization Error:', err.message, err);
    throw err;
  }
}
