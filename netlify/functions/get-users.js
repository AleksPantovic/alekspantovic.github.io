// This function must be called from your frontend as: /.netlify/functions/get-users
// with the Authorization header set to the Haiilo JWT token.

export const handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Allow-Credentials': 'true',
      },
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: 'Method Not Allowed',
    };
  }

  // Read token from Authorization header
  const authHeader = event.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    return {
      statusCode: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: 'Missing Authorization token',
    };
  }

  try {
    // Server-side fetch to Haiilo API (no CORS issue here)
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    const response = await fetch('https://asioso.coyocloud.com/api/users', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.text();

    return {
      statusCode: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: data,
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to fetch users', details: err.message }),
    };
  }
};
