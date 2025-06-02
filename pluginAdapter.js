class PatchedPluginAdapter extends PluginAdapter {
  constructor() {
    super();
    this._initResponse = null;
    this._accessToken = null; // Store the OAuth2 access token
  }

  /**
   * Initialize adapter and cache the response.
   */
  async init() {
    if (!this._initResponse) {
      this._initResponse = await super.init();
    }
    return this._initResponse;
  }

  /**
   * Fetch the Haiilo session token via your Netlify backend proxy (exchange-token).
   */
  async getSessionToken() {
    // Ensure adapter is initialized to have the init token
    const initResponse = await this.init();
    const initToken = initResponse?.token;
    if (!initToken) {
      throw new Error('[PatchedPluginAdapter] Could not get init token.');
    }

    // Call the Netlify function to exchange the init token for a session token
    const response = await fetch('/.netlify/functions/exchange-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ initToken }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Failed to exchange token: ${errorBody}`);
    }

    const responseData = await response.json();

    // Add debug: log error and details if present
    if (responseData.error || responseData.details) {
      console.error('[PatchedPluginAdapter] exchange-token.js error:', responseData.error, responseData.details);
    }

    const { sessionToken } = responseData;

    if (!sessionToken) {
      throw new Error('[PatchedPluginAdapter] No session token returned from exchange-token.js');
    }

    return sessionToken;
  }

  // Store the access token received via webhook
  setAccessToken(accessToken) {
    this._accessToken = accessToken;
  }

  // Fetch users using the stored access token
  async getUsersWithAccessToken() {
    if (!this._accessToken) {
      throw new Error('[PatchedPluginAdapter] No access token available. Ensure the access_token webhook was processed.');
    }
    const response = await fetch('https://asioso.coyocloud.com/api/users', {
      headers: {
        'Authorization': `Bearer ${this._accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    const users = await response.json();
    return users;
  }

  /**
   * Fetch users via the Haiilo API using the session token, but through your Netlify proxy function to avoid CORS.
   */
  async getUsers(sessionToken) {
    // Instead of calling Haiilo API directly, call your Netlify proxy function
    const response = await fetch('/.netlify/functions/fetch-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionToken }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    return response.json();
  }

  /**
   * Fetch users via the Haiilo API using the JWT from adapter.init().
   * This method sends the JWT as a Bearer token in the Authorization header.
   */
  async getUsersWithInitToken() {
    // Get the JWT from adapter.init()
    const initResponse = await this.init();
    const jwt = initResponse?.token;
    if (!jwt) {
      throw new Error('[PatchedPluginAdapter] No JWT token available from adapter.init().');
    }
    const response = await fetch('https://asioso.coyocloud.com/api/users', {
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    const users = await response.json();
    return users;
  }

  /**
   * Test direct call to /api/users with the session token (for debugging only).
   * This will likely fail due to CORS if called from the browser.
   */
  async testDirectHaiiloApiCall(sessionToken) {
    try {
      const res = await fetch('https://asioso.coyocloud.com/api/users', {
        headers:
         {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      const text = await res.text();
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch (err) {
      return null;
    }
  }

  /**
   * Handle access_token webhook event and log the response.
   * This should be called after the 'install' lifecycle event.
   */
  async handleAccessTokenWebhook(eventData) {
    console.log('[PatchedPluginAdapter] Received access_token webhook event in class:', eventData);
    const { access_token } = eventData;
    if (access_token) {
      this.setAccessToken(access_token);
    }
    // You can add further processing here if needed
  }

  /**
   * Simulate listening for lifecycle events and handle access_token after install.
   * In a real plugin, this would be triggered by your backend/webhook handler.
   */
  async handleLifecycleEvent(eventType, eventData) {
    if (eventType === 'install') {
      console.log('[PatchedPluginAdapter] Plugin installed.');
    }
    if (eventType === 'access_token') {
      await this.handleAccessTokenWebhook(eventData);
    }
    // ...handle other events if needed...
  }
}

async function initializePlugin() {
  const adapter = new PatchedPluginAdapter();
  const initResponse = await adapter.init();
  let backendFetchedUsers = null;
  let sessionToken = null;
  let usersWithInitToken = null;
  let usersWithAccessToken = null; // New variable

  try {
    sessionToken = await adapter.getSessionToken();
    if (sessionToken) {
      backendFetchedUsers = await adapter.getUsers(sessionToken);
    }
  } catch (err) {
    // No log
  }

  // Always attempt getUsersWithInitToken, even if above fails
  try {
    usersWithInitToken = await adapter.getUsersWithInitToken();
  } catch (err) {
    // No log
  }

  // Simulate receiving the access_token event (for local testing)
  // In a real Haiilo environment, this would happen via the webhook
  await adapter.handleLifecycleEvent('access_token', {
    access_token: 'example-oauth-access-token',
    token_type: 'Bearer',
    expires_in: 3600,
    scope: 'plugin:notify users.read',
  });

  try {
    usersWithAccessToken = await adapter.getUsersWithAccessToken();
  } catch (err) {
    // No log
  }

  return {
    adapter,
    initResponse,
    sessionToken,
    backendFetchedUsers,
    usersWithInitToken,
    usersWithAccessToken, // Include the new result
  };
}

// Attach to module.exports for CommonJS-style eval usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports.PatchedPluginAdapter = PatchedPluginAdapter;
  module.exports.initializePlugin = initializePlugin;
}

// Call the function and log the result
initializePlugin().then(result => {
  // No log
}).catch(err => {
  // No log
});

// Example: Simulate receiving lifecycle events (for demonstration/testing)
async function simulateLifecycleEvents() {
  const adapter = new PatchedPluginAdapter();
  // Simulate 'install' event
  await adapter.handleLifecycleEvent('install', { /* install event data */ });
  // Simulate 'access_token' event with example data
  await adapter.handleLifecycleEvent('access_token', {
    access_token: 'example-access-token',
    token_type: 'Bearer',
    expires_in: 3600,
    scope: 'plugin:notify users.read'
    // ...other OAuth2 fields...
  });
  // After the 'access_token' event is "received", you can try fetching users
  try {
    const usersWithOauth = await adapter.getUsersWithAccessToken();
    // No log
  } catch (error) {
    // No log
  }
}

// Optionally call simulateLifecycleEvents for demonstration
simulateLifecycleEvents();
