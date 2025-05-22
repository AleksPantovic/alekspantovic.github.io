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
    // TODO: Replace this with the real Haiilo token exchange endpoint and logic.
    // Example (pseudo-code, adjust as needed for Haiilo's API):
    /*
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    const response = await fetch('https://asioso.coyocloud.com/api/token/exchange', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${initToken}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      const errorBody = await response.text();
      return {
        statusCode: response.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: `Failed to exchange token: ${errorBody}`
      };
    }
    const { accessToken } = await response.json();
    */

    // For demonstration, just echo back the init token as the "accessToken"
    // Replace this with the real accessToken from Haiilo when available.
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