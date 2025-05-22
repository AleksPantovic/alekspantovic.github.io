// Netlify Function: exchange-token.js
// Receives the Haiilo plugin init token, exchanges it for a backend API token (if Haiilo provides such an endpoint), and returns it.

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Allow-Credentials': 'true',
      },
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: 'Method Not Allowed',
    };
  }

  const authHeader = event.headers['authorization'] || '';
  const initToken = authHeader.replace('Bearer ', '');

  if (!initToken) {
    return {
      statusCode: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: 'Missing init token',
    };
  }

  try {
    // There is no public Haiilo token exchange endpoint available at
    // /web/authorization/token/exchange (404 Not Found).
    // You cannot exchange the plugin init token for a backend API token automatically.

    // For now, you can only echo back the init token (not recommended for production).
    // If Haiilo provides a real token exchange endpoint in the future, update here.

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ accessToken: initToken })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to exchange token', details: error.message }),
    };
  }
};