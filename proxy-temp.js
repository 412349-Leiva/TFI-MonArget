const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({changeOrigin: true});

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Max-Age', '3600');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  delete req.headers['origin'];

  if (req.url.startsWith('/api/v1/')) {
    const originalUrl = req.url;
    req.url = req.url.replace('/api/v1', '');
    console.log(`[PROXY] ${req.method} ${originalUrl} -> ${req.url} (to backend:8080)`);
    proxy.web(req, res, { target: 'http://localhost:8080' });
  } else {
    console.log(`[PROXY] ${req.method} ${req.url} (to frontend:5180)`);
    proxy.web(req, res, { target: 'http://localhost:5180' });
  }
});

proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err.message);
  res.writeHead(503, { 'Content-Type': 'text/plain' });
  res.end('Service Unavailable');
});

server.listen(3002, () => {
  console.log('✅ Proxy en http://localhost:3002');
});
