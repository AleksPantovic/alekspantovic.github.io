const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use('/api', createProxyMiddleware({
    target: 'https://asioso.coyocloud.com',
    changeOrigin: true,
    pathRewrite: { '^/api': '' },
    onProxyRes: (proxyRes) => {
        proxyRes.headers['Access-Control-Allow-Origin'] = 'https://haiiloplugin.netlify.app';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type';
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    }
}));

app.listen(3000, () => {
    console.log('Proxy server running on http://localhost:3000');
});
