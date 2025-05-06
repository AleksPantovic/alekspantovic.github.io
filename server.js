const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const jwt = require('./jwt'); // Import the jwt utility
const PORT = process.env.PORT || 5000;

const app = express();

// Serve static files from the "dist" directory
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', createProxyMiddleware({
    target: 'https://asioso.coyocloud.com',
    changeOrigin: true,
    pathRewrite: { '^/api': '' },
    onProxyRes: (proxyRes) => {
        proxyRes.headers['Access-Control-Allow-Origin'] = 'https://haiiloplugin.netlify.app';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type';
    }
}));

// Lifecycle event: Install
app.post('/lifecycle/install', (req, res) => {
    console.log('Received lifecycle event: install %s', req.body.token);
    let decodedToken = jwt.decode(req.body.token);
    console.log('Decoded header: %j', decodedToken.header);
    console.log('Decoded payload: %j', decodedToken.payload);

    if (decodedToken.payload.iss.indexOf('coyo') >= 0) {
        console.log('Successful installation');
        res.status(201).json({ code: 100, message: 'ok' });
    } else {
        console.log('Unsupported COYO instance');
        res.status(400).json({ code: 101, message: 'Unsupported COYO instance' });
    }
});

// Start the server
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
