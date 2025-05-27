const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const { token } = JSON.parse(event.body);

    if (!token) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: 'Missing token' }),
      };
    }

    // Extract the `jku` (JSON Web Key URL) from the token header
    const decodedHeader = jwt.decode(token, { complete: true });
    const jku = decodedHeader?.header?.jku;

    if (!jku) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: 'Missing jku in token header' }),
      };
    }

    // Fetch the public key from the `jku` URL
    const jwkResponse = await fetch(jku);
    if (!jwkResponse.ok) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: 'Failed to fetch public key' }),
      };
    }

    const jwk = await jwkResponse.json();

    // Verify the token using the public key
    const publicKey = jwk.keys[0]; // Assuming the first key is the correct one
    const verifiedPayload = jwt.verify(token, publicKey, { algorithms: ['RS256', 'RS512'] });

    if (verifiedPayload.sub !== 'install') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: 'Invalid token subject' }),
      };
    }

    console.log('[install.js] Verified payload:', verifiedPayload);

    // Respond with success
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Plug-in installation accepted' }),
    };
  } catch (error) {
    console.error('[install.js] Error processing install event:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Internal Server Error', details: error.message }),
    };
  }
};
