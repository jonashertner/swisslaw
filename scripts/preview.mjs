// Local-only production preview. No request logging or conversation storage.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { commonHeaders, contentPolicy } from './security-headers.mjs';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const flag = process.argv.indexOf('--port');
const port = flag >= 0 ? Number(process.argv[flag + 1]) : 3013;
if (!Number.isSafeInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid port');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };
createServer(async (req, res) => {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(root, '.' + (path.endsWith('/') ? path + 'index.html' : path));
    if (!file.startsWith(root.endsWith(sep) ? root : root + sep) || path === '/_headers') { res.writeHead(404); res.end(); return; }
    const data = await readFile(file);
    let csp = contentPolicy(path);
    if (extname(file) === '.html') { try { csp = JSON.parse(await readFile(resolve(root, '_csp.json'), 'utf8')).csp; } catch { /* legacy build */ } }
    res.writeHead(200, { ...commonHeaders, ...(csp ? { 'Content-Security-Policy': csp } : {}), 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    try { const nf = await readFile(resolve(root, '404.html')); res.writeHead(404, { ...commonHeaders, 'Content-Type': 'text/html; charset=utf-8' }); res.end(nf); }
    catch { res.writeHead(404, commonHeaders); res.end('Not found'); }
  }
}).listen(port, '127.0.0.1', () => console.log(`Swisslaw preview: http://127.0.0.1:${port}/`));
