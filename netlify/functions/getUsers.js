const axios = require('axios');

exports.handler = async function (event) {
  try {
    // Use environment variables for credentials
    const clientId = process.env.HAIILO_CLIENT_ID;
    const clientSecret = process.env.HAIILO_CLIENT_SECRET;
    const tokenUrl = 'https://asioso.coyocloud.com/auth/realms/coyo/protocol/openid-connect/token';
    const usersApiUrl = 'https://asioso.coyocloud.com/api/users?page=0&size=10';

    // Get access token from Haiilo
    const tokenRes = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const haiiloAccessToken = tokenRes.data.access_token;

    // Fetch users from Haiilo API
    const usersRes = await axios.get(usersApiUrl, {
      headers: { Authorization: `Bearer ${haiiloAccessToken}` }
    });

    return {
      statusCode: 200,
      body: JSON.stringify(usersRes.data)
    };
  } catch (err) {
    console.error('Backend error:', err.response?.data || err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message, details: err.response?.data })
    };
  }
};
