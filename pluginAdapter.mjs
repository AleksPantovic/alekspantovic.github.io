import { PluginAdapter } from 'https://cdn.jsdelivr.net/npm/@coyoapp/plugin-adapter/+esm';

/**
 * Initialize the plugin and return an adapter instance with extended functionality.
 */
export async function createPluginAdapter() {
  const adapter = new PluginAdapter();

  // Initialize the adapter
  const initResponse = await adapter.init();
  console.log('[pluginAdapter.mjs] Adapter initialized with context:', initResponse);

  /**
   * Fetch the Haiilo session token via the Netlify backend proxy.
   */
  async function getSessionToken() {
    const initToken = initResponse?.token;
    if (!initToken) {
      throw new Error('[pluginAdapter.mjs] Could not get init token.');
    }

    console.log('[pluginAdapter.mjs] Init Token:', initToken);

    const response = await fetch('/.netlify/functions/exchange-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ initToken }),
    });

    const responseData = await response.json();
    console.log('[pluginAdapter.mjs] Full Response from exchange-token.js:', responseData);

    const { sessionToken } = responseData;

    if (!sessionToken) {
      throw new Error('[pluginAdapter.mjs] No session token returned from exchange-token.js');
    }

    console.log('[pluginAdapter.mjs] Session Token obtained from exchange-token.js:', sessionToken);
    return sessionToken;
  }

  /**
   * Fetch users via the Haiilo API using the session token.
   */
  async function getUsers(sessionToken) {
    const response = await adapter.fetch('GET', '/api/users', {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[pluginAdapter.mjs] getUsers() error:', response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const users = await response.json();
    console.log('[pluginAdapter.mjs] Users fetched:', users);
    return users;
  }

  return {
    adapter,
    getSessionToken,
    getUsers,
  };
}
