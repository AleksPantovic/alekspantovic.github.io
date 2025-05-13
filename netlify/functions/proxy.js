const axios = require('axios');

exports.handler = async (event) => {
  try {
    const haiiloApiUrl = 'https://asioso.coyocloud.com/api/user';

    // Forward the headers from the request
    const headers = {
      'Authorization': 'Bearer <ACCESS_TOKEN>', // Replace <ACCESS_TOKEN> with a valid token
      'X-Client-ID': '<X_COYO_CLIENT_ID>', // Replace with your client ID
      'X-Coyo-Current-User': '<X_COYO_CURRENT_USER>', // Replace with the current user ID
      'X-Csrf-Token': '<X_CSRF_TOKEN>', // Replace with a valid CSRF token
      'Accept-Version': '1.5.0',
      'Accept': 'application/json',
    };

    console.log('Forwarding request to Haiilo API with headers:', headers);

    // Make the request to the Haiilo API using axios
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
    };
  }
};
