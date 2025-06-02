const fs = require('fs');
const path = require('path');

exports.handler = async function (event) {
  try {
    const payload = JSON.parse(event.body);
    const accessToken = payload.access_token;
    const tenantId = payload.tenantId || payload.instanceId;

    console.log('[oauth-callback] Received token:', accessToken);
    if (tenantId) {
      console.log('[oauth-callback] For tenant/instance:', tenantId);
    } else {
      console.warn('[oauth-callback] No tenant/instance ID found in payload.');
    }

    // Store it to a file (for demo; use secure storage in production)
    fs.writeFileSync(path.join('/tmp', 'haiilo-token.txt'), accessToken);
    console.log('[oauth-callback] Token written to /tmp/haiilo-token.txt');

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Token stored successfully.' }),
    };
  } catch (err) {
    console.error('[oauth-callback] Error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to store token.' }),
    };
  }
};
