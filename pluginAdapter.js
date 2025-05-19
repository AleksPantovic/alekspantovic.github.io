import { PluginAdapter } from '@coyoapp/plugin-adapter';
import axios from 'axios';

const PLUGIN_BACKEND_INIT = '/auth/init'; // Your backend endpoint to exchange the Haiilo init token

// Initialize the plugin adapter and send the init token to your backend
export async function initializePlugin() {
  try {
    console.log('[PluginAdapter] Initializing plugin adapter...');
    const adapter = new PluginAdapter();
    const initResponse = await adapter.init();
    console.log('[PluginAdapter] adapter.init() response:', initResponse);

    // Send the init token to your backend to get an API token
    console.log(`[PluginAdapter] Sending token to backend: ${PLUGIN_BACKEND_INIT}`, initResponse.token);
    const backendRes = await axios.post(PLUGIN_BACKEND_INIT, { token: initResponse.token });
    console.log('[PluginAdapter] Backend /auth/init response:', backendRes);

    // Return both the adapter and backend token
    return {
      adapter,
      initResponse,
      backendAccessToken: backendRes.data
    };
  } catch (err) {
    console.error('Initialization Error:', err.message, err);
    throw err;
  }
}
