// Netlify Function: exchange-token.js
// Receives the Haiilo plugin init token, exchanges it for a backend API token (if Haiilo provides such an endpoint), and returns it.

const axios = require('axios');

exports.handler = async (event) => {
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
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const { initToken } = JSON.parse(event.body);

    if (!initToken) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Missing initToken' }),
      };
    }

    console.log('[exchange-token.js] Received initToken:', initToken);

    // Call Haiilo's token exchange endpoint
    const haiiloTokenExchangeUrl = 'https://asioso.coyocloud.com/api/oauth/token';
    const response = await axios.post(
      haiiloTokenExchangeUrl,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: initToken, // Assuming the initToken is an authorization code
        redirect_uri: 'https://yourplugin.yourcompany.test', // Replace with your redirect URI
        client_id: process.env.HAIILO_CLIENT_ID, // Set in environment variables
        client_secret: process.env.HAIILO_CLIENT_SECRET, // Set in environment variables
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token } = response.data;

    if (!access_token) {
      console.error('[exchange-token.js] No access token returned from Haiilo API');
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'No access token returned' }),
      };
    }

    console.log('[exchange-token.js] Access Token:', access_token);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionToken: access_token }),
    };
  } catch (error) {
    console.error('[exchange-token.js] Token exchange failed:', error.response?.data || error.message);
    return {
      statusCode: error.response?.status || 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Token exchange failed',
        details: error.response?.data || error.message,
      }),
    };
  }
};