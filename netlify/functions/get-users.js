export async function handler(event, context) {
  const token = event.headers['authorization'] || event.headers['Authorization'];
  try {
    const response = await fetch('https://asioso.coyocloud.com/api/users', {
      headers: {
        'Authorization': token,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
