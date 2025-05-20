export async function handler(event, context) {
  // Log incoming headers for debugging
  console.log('[Netlify get-users] Incoming headers:', JSON.stringify(event.headers, null, 2));

  // Accept both "authorization" and "Authorization"
  let token = event.headers['authorization'] || event.headers['Authorization'];
  if (!token) {
    return {
      statusCode: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: JSON.stringify({ error: 'Missing Authorization header' })
    };
  }

  // Remove Bearer prefix if present, then re-add it (to avoid double Bearer or missing Bearer)
  token = token.replace(/^Bearer\s+/i, '');

  try {
    // Log outgoing Authorization header
    console.log('[Netlify get-users] Outgoing Authorization:', `Bearer ${token}`);

    const response = await fetch('https://asioso.coyocloud.com/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const rawText = await response.text();
    console.log('[Haiilo API] Status:', response.status);
    console.log('[Haiilo API] Body:', rawText);
    console.log('[Haiilo API] Headers:', JSON.stringify([...response.headers]));

    return {
      statusCode: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: rawText // Pass through the raw response from Haiilo
    };
  } catch (error) {
    console.error('[Netlify get-users] Fetch Error:', error.message);
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
