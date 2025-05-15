(async () => {
  const baseURL = window.location.origin; // assumes running inside Haiilo iframe
  try {
    // Step 1: Get OAuth2 token for current user session
    const authRes = await fetch(`${baseURL}/web/authorization/token`, {
      method: 'GET',
      credentials: 'include'
    });
    if (!authRes.ok) throw new Error('Authorization failed');
    const authJson = await authRes.json();
    const accessToken = authJson.access_token || authJson.token;

    // Step 2: Fetch users with the token
    const usersRes = await fetch(`${baseURL}/api/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      credentials: 'include'
    });
    if (!usersRes.ok) throw new Error('Failed to fetch users');
    const users = await usersRes.json();

    // Step 3: Render users (simple)
    const pre = document.createElement('pre');
    pre.textContent = JSON.stringify(users, null, 2);
    document.body.appendChild(pre);
  } catch (err) {
    document.body.textContent = 'Error: ' + err.message;
  }
})();
