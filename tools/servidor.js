/*
  Servidor estatico de desenvolvimento. Zero dependencia.

      node tools/servidor.js

  Existe por dois motivos que o `python -m http.server` nao resolve:

  1. Cache-Control: no-store. O http.server do python nao manda cabecalho de
     cache nenhum, entao o navegador aplica heuristica propria e serve CSS e
     JS velhos depois de uma edicao — da pra passar meia hora medindo uma
     pagina que e metade nova e metade antiga.

  2. Range. O <video> pede o arquivo em pedacos (206 Partial Content). Sem
     isso o Safari simplesmente nao toca.

  Isto e ferramenta de dev. O site em producao e estatico no GitHub Pages.
*/

const http = require('http');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const PORTA = Number(process.argv[2]) || 5173;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
};

http
  .createServer((req, res) => {
    let rota = decodeURIComponent(req.url.split('?')[0]);
    if (rota.endsWith('/')) rota += 'index.html';

    const arquivo = path.join(RAIZ, rota);
    // Nao deixa subir pra fora da raiz com ../
    if (!arquivo.startsWith(RAIZ)) {
      res.writeHead(403).end('403');
      return;
    }

    let stat;
    try {
      stat = fs.statSync(arquivo);
    } catch {
      res.writeHead(404).end('404 ' + rota);
      return;
    }
    if (stat.isDirectory()) {
      res.writeHead(404).end('404 ' + rota);
      return;
    }

    const tipo = TIPOS[path.extname(arquivo).toLowerCase()] || 'application/octet-stream';
    const base = { 'Content-Type': tipo, 'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes' };
    const range = req.headers.range;

    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      const inicio = m && m[1] ? Number(m[1]) : 0;
      const fim = m && m[2] ? Number(m[2]) : stat.size - 1;

      if (inicio >= stat.size || fim >= stat.size || inicio > fim) {
        res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }).end();
        return;
      }

      res.writeHead(206, {
        ...base,
        'Content-Range': `bytes ${inicio}-${fim}/${stat.size}`,
        'Content-Length': fim - inicio + 1,
      });
      fs.createReadStream(arquivo, { start: inicio, end: fim }).pipe(res);
      return;
    }

    res.writeHead(200, { ...base, 'Content-Length': stat.size });
    fs.createReadStream(arquivo).pipe(res);
  })
  .listen(PORTA, () => {
    console.log(`http://localhost:${PORTA}  (no-store, com Range)`);
  });
