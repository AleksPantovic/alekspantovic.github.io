const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// Endpoint to fetch all user directories
router.get('/userdirectories', async (req, res) => {
    try {
        const haiiloApiUrl = `https://asioso.coyocloud.com/api/userdirectories`;
        const response = await fetch(haiiloApiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer 81dd0c6a-6fd9-43ff-878c-21327b07ae1b`, // Replace with your Haiilo API token
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
router.get('/userdirectories/:id', async (req, res) => {
    const userDirectoryId = req.params.id;

    try {
        const haiiloApiUrl = `https://asioso.coyocloud.com/api/userdirectories/${userDirectoryId}`;
        const response = await fetch(haiiloApiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer 81dd0c6a-6fd9-43ff-878c-21327b07ae1b`, // Replace with your Haiilo API token
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
router.get('/users', async (req, res) => {
    try {
        const haiiloApiUrl = `https://asioso.coyocloud.com/api/users`; // Correct Haiilo API URL
        const response = await fetch(haiiloApiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer 81dd0c6a-6fd9-43ff-878c-21327b07ae1b`, // Replace with your Haiilo API token
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
router.get('/users/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const haiiloApiUrl = `https://asioso.coyocloud.com/api/users/${userId}`;
        const response = await fetch(haiiloApiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer 81dd0c6a-6fd9-43ff-878c-21327b07ae1b`, // Replace with your Haiilo API token
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