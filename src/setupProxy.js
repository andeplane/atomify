const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy /chapters/* requests to Quarto's preview server
  app.use(
    '/chapters',
    createProxyMiddleware({
      target: 'http://localhost:5350',
      changeOrigin: true,
    })
  );
};

