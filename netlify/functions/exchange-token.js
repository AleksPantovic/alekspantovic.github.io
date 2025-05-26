// Netlify Function: exchange-token.js
// Receives the Haiilo plugin init token, exchanges it for a backend API token (if Haiilo provides such an endpoint), and returns it.

const fs = require('fs');
const path = require('path');
const axios = require('axios'); // Add axios for HTTP requests

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
    // Extract client credentials from environment variables
    const clientId = process.env.HAIILO_CLIENT_ID;
    const clientSecret = process.env.HAIILO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: 'Missing client credentials',
      };
    }

    // Exchange the init token for an access token
    const tokenResponse = await axios.post(
      'https://your-haiilo-instance.com/api/oauth/token',
      new URLSearchParams({
        grant_type: 'password',
        username: 'test@haiilo.com', // Replace with dynamic username if needed
        password: 'secret', // Replace with dynamic password if needed
      }),
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token } = tokenResponse.data;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accessToken: access_token }),
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