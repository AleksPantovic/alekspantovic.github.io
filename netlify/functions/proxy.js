const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    const haiiloApiUrl = 'https://asioso.coyocloud.com/api/user';

    // Forward the headers from the request
    const headers = {
      'Authorization': event.headers['authorization'] || 'Bearer <ACCESS_TOKEN>', // Replace <ACCESS_TOKEN> with a valid token
      'X-Client-ID': event.headers['x-client-id'] || '<X_COYO_CLIENT_ID>', // Replace with your client ID
      'X-Coyo-Current-User': event.headers['x-coyo-current-user'] || '<X_COYO_CURRENT_USER>', // Replace with the current user ID
      'X-Csrf-Token': event.headers['x-csrf-token'] || '<X_CSRF_TOKEN>', // Replace with a valid CSRF token
      'Accept-Version': '1.5.0',
      'Accept': 'application/json',
    };

    console.log('Forwarding request to Haiilo API with headers:', headers);

    // Make the request to the Haiilo API
    const response = await fetch(haiiloApiUrl, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    return {
      statusCode: response.status,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Error proxying request to Haiilo API:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch data from Haiilo API', details: error.message }),
    };
  }
};
