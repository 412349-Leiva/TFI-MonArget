const http = require('http');
const httpProxy = require('http-proxy');

// Crear proxy sin CORS handling en Spring — proxy maneja CORS completamente
const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
});

// Crear servidor
const server = http.createServer((req, res) => {
  // CORS headers siempre presentes
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Max-Age', '3600');

  // Handle preflight - respond before routing
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Route requests - remover Origin header antes de enviar al backend
  // para que Spring no intente validar CORS
  delete req.headers['origin'];

  // Route based on path
  if (req.url.startsWith('/api/v1/')) {
    // Backend tiene context path /api/v1 - NO remapear
    console.log(`[PROXY] ${req.method} ${req.url} (to backend:8083)`);
    proxy.web(req, res, { target: 'http://localhost:8083' });
  } else {
    console.log(`[PROXY] ${req.method} ${req.url} (to frontend:5180)`);
    // Frontend en 5180
    proxy.web(req, res, { target: 'http://localhost:5180' });
  }
});

// Error handling
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err.message);
  res.writeHead(503, { 'Content-Type': 'text/plain' });
  res.end('Service Unavailable');
});

// Listen
server.listen(3002, () => {
  console.log('✅ Proxy escuchando en http://localhost:3002');
  console.log('   - Frontend: http://localhost:3002');
  console.log('   - API: http://localhost:3002/api/*');
});
