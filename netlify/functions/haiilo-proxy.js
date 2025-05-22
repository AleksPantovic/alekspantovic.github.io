// UNUSED FUNCTION: This Netlify function is not used by the current plugin logic.
// To enable later, uncomment the code below.
/*
export async function handler(event) {
  const { queryStringParameters } = event;

  const HAIILO_API = "https://asioso.coyocloud.com/api/users";
  const HAIILO_TOKEN = process.env.HAIILO_TOKEN;

  try {
    const res = await fetch(HAIILO_API, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${HAIILO_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", 
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Haiilo fetch failed", details: err.message }),
    };
  }
}
*/
