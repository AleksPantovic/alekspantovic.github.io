const axios = require('axios');

exports.handler = async (event) => {
  try {
    // Get access token using client credentials
    const tokenResponse = await axios.post('https://asioso.coyocloud.com/api/oauth/token', new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: 'organization',
      client_secret: '81dd0c6a-6fd9-43ff-878c-21327b07ae1b',
      scope: 'plugin:notify'
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const accessToken = tokenResponse.data.access_token;

    // Use access token to fetch users
    const response = await axios.get('https://asioso.coyocloud.com/api/users', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept-Version': '1.5.0',
        'Accept': 'application/json'
      }
    });

    return {
      statusCode: response.status,
      body: JSON.stringify(response.data),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({
        error: 'Failed to fetch data from Haiilo API',
        details: error.response?.data || error.message
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
