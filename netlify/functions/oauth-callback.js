const fs = require('fs');
const path = require('path');

exports.handler = async function (event) {
  try {
    const payload = JSON.parse(event.body);
    const accessToken = payload.access_token;

    console.log('[oauth-callback] Received token:', accessToken);

    // Store it to a file (for demo; use secure storage in production)
    fs.writeFileSync(path.join('/tmp', 'haiilo-token.txt'), accessToken);

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
