import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const root = process.env.PREVIEW_ROOT || 'web/dist';
const port = Number(process.env.PORT || 4187);
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
};

createServer((req, res) => {
  let p = decodeURIComponent(String(req.url).split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = join(root, normalize(p).replace(/^(\.\.[/\\])+/, ''));
  if (!existsSync(f) || statSync(f).isDirectory()) {
    const nf = join(root, 'en-US', '404.html');
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    res.end(existsSync(nf) ? readFileSync(nf) : '404');
    return;
  }
  res.writeHead(200, {
    'content-type': types[extname(f).toLowerCase()] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  });
  res.end(readFileSync(f));
}).listen(port, '127.0.0.1', () => {
  console.log('preview http://127.0.0.1:' + port + ' root=' + root);
});
