// UNUSED FUNCTION: This Netlify function is not used by the current plugin logic.
// To enable later, uncomment the code below.
/*
const axios = require('axios');

exports.handler = async function(event) {
  try {
    // Get the Authorization header from the incoming request (forward the Bearer token)
    const authHeader = event.headers['authorization'] || event.headers['Authorization'];
    if (!authHeader) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Missing Authorization header' })
      };
    }

    // Forward the request to Haiilo API
    const haiiloRes = await axios.get('https://asioso.coyocloud.com/api/users', {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      }
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(haiiloRes.data)
    };
  } catch (err) {
    return {
      statusCode: err.response?.status || 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: err.message, details: err.response?.data })
    };
  }
};
*/
