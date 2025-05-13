const axios = require('axios');

exports.handler = async (event) => {
  try {
    // Prepare headers using secrets from Netlify env vars
    const headers = {
      'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
      'X-Client-ID': process.env.X_COYO_CLIENT_ID,
      'X-Coyo-Current-User': process.env.X_COYO_CURRENT_USER,
      'X-Csrf-Token': process.env.X_CSRF_TOKEN,
      'Accept-Version': '1.5.0',
      'Accept': 'application/json',
    };

    // Make the request to Haiilo API
    const response = await axios.get('https://asioso.coyocloud.com/api/users', { headers });

    // Return the data to the frontend
    return {
      statusCode: response.status,
      body: JSON.stringify(response.data),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    // Return error info as JSON
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({
        error: 'Failed to fetch data from Haiilo API',
        details: error.response?.data || error.message,
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
