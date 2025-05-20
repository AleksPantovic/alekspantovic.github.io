import { PluginAdapter } from 'https://cdn.jsdelivr.net/npm/@coyoapp/plugin-adapter/+esm';
import axios from 'https://cdn.jsdelivr.net/npm/axios/+esm';

const PLUGIN_BACKEND_INIT = '/.netlify/functions/auth-init'; // Token exchange
const PLUGIN_BACKEND_USERS = '/.netlify/functions/get-users'; // User fetch

export class PatchedPluginAdapter extends PluginAdapter {
  async initAndPatch() {
    const initResponse = await this.init();
    this._initResponse = initResponse;
    return initResponse;
  }

  async getUsers(apiToken) {
    console.log('[PatchedPluginAdapter] Fetching users with token:', apiToken);

    const res = await fetch(PLUGIN_BACKEND_USERS, {
      headers: {
        Authorization: `Bearer ${apiToken}`
      }
    });

    const text = await res.text();
    console.log('[PatchedPluginAdapter] Raw response:', text);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('[PatchedPluginAdapter] Failed to parse JSON:', e);
      throw e;
    }
  }
}

export async function initializePlugin() {
  const adapter = new PatchedPluginAdapter();

  console.log('[PluginAdapter] Calling adapter.init()...');
  const initResponse = await adapter.initAndPatch();
  console.log('[PluginAdapter] Init response:', initResponse);

  const initToken = initResponse.token;

  // Step 1: Exchange init token for API token
  console.log(`[PluginAdapter] Exchanging init token at ${PLUGIN_BACKEND_INIT}`);
  const { data: accessTokenResponse } = await axios.post(PLUGIN_BACKEND_INIT, {
    token: initToken
  });

  const accessToken = accessTokenResponse.access_token || accessTokenResponse.token;
  console.log('[PluginAdapter] Received access token:', accessToken);

  // Step 2: Fetch users with real token
  const users = await adapter.getUsers(accessToken);

  return {
    adapter,
    initResponse,
    backendAccessToken: accessToken,
    backendFetchedUsers: users
  };
}
