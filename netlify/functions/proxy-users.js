const axios = require('axios');

exports.handler = async (event) => {
  try {
    // Step 1: Get OAuth2 token for current user session (using cookies from the browser)
    const tokenRes = await axios.get('https://asioso.coyocloud.com/web/authorization/token', {
      headers: {
        cookie: event.headers.cookie || '',
      },
      withCredentials: true,
    });

    const accessToken = tokenRes.data.access_token || tokenRes.data.token;

    // Step 2: Fetch users with the token
    const usersRes = await axios.get('https://asioso.coyocloud.com/api/users?page=0&size=10', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        cookie: event.headers.cookie || '',
      },
      withCredentials: true,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(usersRes.data),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': event.headers.origin || '*',
        'Access-Control-Allow-Credentials': 'true',
      },
    };
  } catch (err) {
    return {
      statusCode: err.response?.status || 500,
      body: JSON.stringify({ error: err.message }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': event.headers.origin || '*',
        'Access-Control-Allow-Credentials': 'true',
      },
    };
  }
};
