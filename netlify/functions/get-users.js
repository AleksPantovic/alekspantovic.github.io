export async function handler(event, context) {
  const token = event.headers['authorization'] || event.headers['Authorization'];
  try {
    // Debug: log incoming Authorization header
    console.log('[Netlify get-users] Incoming Authorization:', token);

    const response = await fetch('https://asioso.coyocloud.com/api/users', {
      headers: {
        'Authorization': token,
        'Accept': 'application/json'
      }
    });

    // Log the response status and body for debugging
    const text = await response.text();
    console.log('[Netlify get-users] Haiilo API status:', response.status);
    console.log('[Netlify get-users] Haiilo API response:', text);

    // Debug: log response headers
    console.log('[Netlify get-users] Haiilo API headers:', JSON.stringify([...response.headers]));

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return {
        statusCode: 502,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        body: JSON.stringify({ error: 'Haiilo API did not return JSON', raw: text })
      };
    }

    return {
      statusCode: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    // Debug: log error stack
    console.error('[Netlify get-users] Error:', error && error.stack ? error.stack : error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: JSON.stringify({ error: error.message })
    };
  }
}
