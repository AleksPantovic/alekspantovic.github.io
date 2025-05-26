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
      body: 'Method Not Allowed',
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

    // Hypothetical Haiilo endpoint for token exchange
    const haiiloTokenExchangeUrl = 'https://asioso.coyocloud.com/api/oauth/token/exchange';

    const response = await axios.post(
      haiiloTokenExchangeUrl,
      {}, // Adjust body if required by the API
      {
        headers: {
          Authorization: `Bearer ${initToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const sessionToken = response.data.access_token;

    if (!sessionToken) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'No session token returned' }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionToken }),
    };
  } catch (error) {
    console.error('Token exchange failed:', error.response?.data || error.message);
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