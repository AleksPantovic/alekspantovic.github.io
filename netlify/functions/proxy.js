const axios = require('axios');

exports.handler = async (event) => {
  try {
    const haiiloApiUrl = 'https://asioso.coyocloud.com/api/user';

    // Use environment variables for credentials
    const headers = {
      'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
      'X-Client-ID': process.env.X_COYO_CLIENT_ID,
      'X-Coyo-Current-User': process.env.X_COYO_CURRENT_USER,
      'X-Csrf-Token': process.env.X_CSRF_TOKEN,
      'Accept-Version': '1.5.0',
      'Accept': 'application/json',
    };

    console.log('Forwarding request to Haiilo API with headers:', headers);

    const response = await axios.get(haiiloApiUrl, { headers });

    return {
      statusCode: response.status,
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    console.error('Error proxying request to Haiilo API:', error.message);
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({
        error: 'Failed to fetch data from Haiilo API',
        details: error.response?.data || error.message,
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
};
