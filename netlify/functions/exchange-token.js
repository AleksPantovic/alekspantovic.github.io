// Netlify Function: exchange-token.js
// Receives the Haiilo plugin init token, exchanges it for a backend API token (if Haiilo provides such an endpoint), and returns it.

const fetch = require('node-fetch');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { initToken } = JSON.parse(event.body);

    if (!initToken) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing initToken' }),
      };
    }

    const haiiloRes = await fetch('https://asioso.coyocloud.com/web/authorization/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
        subjectToken: initToken,
      }),
    });

    const responseBody = await haiiloRes.text();
    if (!haiiloRes.ok) {
      console.error('[exchange-token.js] Haiilo error:', haiiloRes.status, responseBody);
      return {
        statusCode: haiiloRes.status,
        body: JSON.stringify({ error: 'Token exchange failed', details: responseBody }),
      };
    }

    const data = JSON.parse(responseBody);
    console.log('[exchange-token.js] Session token received:', data);

    return {
      statusCode: 200,
      body: JSON.stringify({ sessionToken: data.token }),
    };
  } catch (error) {
    console.error('[exchange-token.js] Unexpected error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message }),
    };
  }
};