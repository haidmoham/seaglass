import { createServer } from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createServer as createVite } from 'vite';

const output = resolve(process.argv[2] ?? 'demo-output');
await mkdir(output, { recursive: true });
const vite = await createVite({ server: { middlewareMode: true }, appType: 'mpa' });
createServer(async (request, response) => {
  if (request.url !== '/save-recording' || request.method !== 'POST') {
    vite.middlewares(request, response);
    return;
  }
  if (request.headers.origin !== 'http://127.0.0.1:5175') {
    response.writeHead(403).end();
    return;
  }
  try {
    const chunks = [];
    let bytes = 0;
    for await (const chunk of request) {
      bytes += chunk.length;
      if (bytes > 80_000_000) throw new Error('Recording exceeds size limit');
      chunks.push(chunk);
    }
    await writeFile(resolve(output, 'capture.webm'), Buffer.concat(chunks));
    response.writeHead(200).end('saved');
  } catch {
    response.writeHead(500).end('recording failed');
  }
}).listen(5175, '127.0.0.1');
