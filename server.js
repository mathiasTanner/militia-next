// server.js
const { spawn } = require('child_process');
const http = require('http');
const { createProxyServer } = require('http-proxy');

const NEXT_PORT = process.env.NEXT_INTERNAL_PORT || 4000;
const STRAPI_PORT = process.env.STRAPI_INTERNAL_PORT || 4001;
const PUBLIC_PORT = process.env.PORT || 3000; // Infomaniak provides this at runtime

// Start Next.js
const nextProc = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'start'], {
  cwd: './web',
  env: { ...process.env, PORT: NEXT_PORT, NODE_ENV: 'production' },
  stdio: 'inherit'
});

// Start Strapi
const strapiProc = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'start'], {
  cwd: './cms',
  env: { ...process.env, PORT: STRAPI_PORT, HOST: '127.0.0.1', NODE_ENV: 'production' },
  stdio: 'inherit'
});

const proxy = createProxyServer({});
proxy.on('error', (_err, req, res) => {
  res.writeHead(502, { 'Content-Type': 'text/plain' });
  res.end('Proxy error');
});

// Public server: proxy /admin, /api, /uploads to Strapi; everything else to Next
const server = http.createServer((req, res) => {
  const url = req.url || '/';
  if (url.startsWith('/admin') || url.startsWith('/api') || url.startsWith('/uploads')) {
    return proxy.web(req, res, { target: `http://127.0.0.1:${STRAPI_PORT}` });
  }
  return proxy.web(req, res, { target: `http://127.0.0.1:${NEXT_PORT}` });
});

// (optional) websockets upgrade → Next
server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head, { target: `http://127.0.0.1:${NEXT_PORT}` });
});

server.listen(PUBLIC_PORT, () => {
  console.log(`Public entry listening on ${PUBLIC_PORT}`);
});

process.on('SIGINT', () => {
  try { nextProc.kill('SIGINT'); } catch {}
  try { strapiProc.kill('SIGINT'); } catch {}
  process.exit(0);
});
