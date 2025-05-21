import { PluginAdapter } from 'https://cdn.jsdelivr.net/npm/@coyoapp/plugin-adapter/+esm';

const HAIILO_SESSION_TOKEN_URL = 'https://asioso.coyocloud.com/web/authorization/token';
const PLUGIN_BACKEND_USERS = '/.netlify/functions/get-users';
// plugin-adapter.js
export class PatchedPluginAdapter extends PluginAdapter {
  async getUsers() {
    const sessionToken = await this.getHaiiloSessionToken();
    const res = await fetch('https://asioso.coyocloud.com/api/users', {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      credentials: 'include'
    });
    return res.json();
  }
}


export async function initializePlugin() {
  const adapter = new PatchedPluginAdapter();
  const initResponse = await adapter.initAndPatch(); // only for plugin context
  const backendFetchedUsers = await adapter.getUsers(); // uses correct session token

  return { adapter, initResponse, backendFetchedUsers };
}
