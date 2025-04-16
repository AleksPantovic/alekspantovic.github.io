const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

let accessToken = null; // Store the access token in memory

// Function to refresh the access token
async function refreshAccessToken() {
    try {
        const haiiloTokenUrl = 'https://asioso.coyocloud.com/api/oauth/token';
        const clientId = 'organization';
        const clientSecret = '81dd0c6a-6fd9-43ff-878c-21327b07ae1b'; // Replace with the actual client secret
        const encodedCredentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        const response = await fetch(`${haiiloTokenUrl}?grant_type=authorization_code&code=39vjx2`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${encodedCredentials}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to refresh access token: ${response.statusText}`);
        }

        const data = await response.json();
        accessToken = data.access_token;
    } catch (error) {
        console.error('Error refreshing access token:', error);
    }
}

// Middleware to ensure access token is available
async function ensureAccessToken(req, res, next) {
    if (!accessToken) {
        await refreshAccessToken();
    }
    next();
}

// Endpoint to fetch all user directories
router.get('/userdirectories', ensureAccessToken, async (req, res) => {
    try {
        const haiiloApiUrl = `https://asioso.coyocloud.com/api/userdirectories`;
        const response = await fetch(haiiloApiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch user directories: ${response.statusText}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching user directories:', error);
        res.status(500).json({ error: 'Failed to fetch user directories' });
    }
});

// Endpoint to fetch a specific user directory
router.get('/userdirectories/:id', ensureAccessToken, async (req, res) => {
    const userDirectoryId = req.params.id;

    try {
        const haiiloApiUrl = `https://asioso.coyocloud.com/api/userdirectories/${userDirectoryId}`;
        const response = await fetch(haiiloApiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch user directory: ${response.statusText}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching user directory:', error);
        res.status(500).json({ error: 'Failed to fetch user directory' });
    }
});

// Endpoint to fetch all users
router.get('/users', ensureAccessToken, async (req, res) => {
    try {
        const haiiloApiUrl = `https://asioso.coyocloud.com/api/users`;
        const response = await fetch(haiiloApiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch users: ${response.statusText}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Endpoint to fetch a specific user by ID
router.get('/users/:id', ensureAccessToken, async (req, res) => {
    const userId = req.params.id;

    try {
        const haiiloApiUrl = `https://asioso.coyocloud.com/api/users/${userId}`;
        const response = await fetch(haiiloApiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch user: ${response.statusText}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

module.exports = router;