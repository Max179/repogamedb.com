import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
const root = 'web/dist';
const types = { '.html': 'text/html; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8' };
createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = join(root, normalize(p).replace(/^(\.\.[/\\])+/, ''));
  if (!existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); res.end('404'); return; }
  res.writeHead(200, { 'content-type': types[extname(f)] ?? 'application/octet-stream' });
  res.end(readFileSync(f));
}).listen(4187, '127.0.0.1', () => console.log('preview on http://127.0.0.1:4187'));
