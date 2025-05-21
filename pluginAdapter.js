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

    // DEBUG: Show where the call is coming from
    if (typeof window !== "undefined") {
      console.log('[PatchedPluginAdapter] getUsers() called from browser');
    } else {
      console.log('[PatchedPluginAdapter] getUsers() called from serverless function');
    }

    const res = await fetch(PLUGIN_BACKEND_USERS, {
      headers: {
        Authorization: `Bearer ${apiToken}`
      }
    });

    const text = await res.text();
    console.log('[PatchedPluginAdapter] Raw response:', text);

    // Log status and content-type for debugging
    console.log('[PatchedPluginAdapter] Response status:', res.status);
    console.log('[PatchedPluginAdapter] Response content-type:', res.headers.get('content-type'));

    if (!res.ok) {
      // Log the error body for debugging
      console.error('[PatchedPluginAdapter] HTTP error:', res.status, text);
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    try {
      const data = JSON.parse(text);
      // If backend returns a wrapped error, log it
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
