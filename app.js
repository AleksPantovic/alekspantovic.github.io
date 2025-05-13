// This file is no longer needed. All proxying and static file serving is handled by Netlify.
// If you want to test API requests locally with axios, use the following minimal example:

const axios = require('axios');
require('dotenv').config();

// Example usage:
async function fetchHaiiloUser() {
  try {
    const response = await axios.get('https://asioso.coyocloud.com/api/user', {
      headers: {
        'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
        'X-Client-ID': process.env.X_COYO_CLIENT_ID,
        'X-Coyo-Current-User': process.env.X_COYO_CURRENT_USER,
        'X-Csrf-Token': process.env.X_CSRF_TOKEN,
        'Accept-Version': '1.5.0',
        'Accept': 'application/json',
      }
    });
    console.log(response.data);
  } catch (error) {
    console.error('Error fetching Haiilo user:', error.response?.data || error.message);
  }
}

fetchHaiiloUser();