import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { WebSocketServer, WebSocket } from 'ws';

const page = await readFile(new URL('./public/index.html', import.meta.url));
const server = http.createServer((req, res) => {
  if (!['/', '/drawlink', '/drawlink/'].includes(req.url?.split('?')[0])) {
    res.writeHead(404).end('Nicht gefunden'); return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(page);
});
const wss = new WebSocketServer({ server, maxPayload: 1024 });
let lines = [];
const broadcast = message => {
  const json = JSON.stringify(message);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(json);
  }
};
const count = () => broadcast({ type: 'users', count: wss.clients.size });
wss.on('connection', socket => {
  socket.alive = true;
  socket.on('pong', () => { socket.alive = true; });
  socket.send(JSON.stringify({ type: 'init', lines }));
  count();
  socket.on('error', () => {});
  socket.on('close', count);
  socket.on('message', data => {
    let message;
    try { message = JSON.parse(data.toString()); } catch { return; }
    if (message.type === 'clear') {
      lines = []; broadcast({ type: 'clear' }); return;
    }
    const { x1, y1, x2, y2, color } = message;
    if (message.type !== 'draw' || ![x1,y1,x2,y2].every(n => Number.isFinite(n) && n >= 0 && n <= 1)
      || !/^#[0-9a-f]{6}$/i.test(color)) return;
    // Eine Obergrenze hält den Speicherverbrauch der Mini-Demo begrenzt.
    if (lines.length >= 50000) { socket.send(JSON.stringify({ type: 'full' })); return; }
    const line = { type: 'draw', x1, y1, x2, y2, color };
    lines.push(line);
    broadcast(line);
  });
});
const heartbeat = setInterval(() => {
  for (const client of wss.clients) {
    if (!client.alive) { client.terminate(); continue; }
    client.alive = false; client.ping();
  }
}, 30000);
wss.on('close', () => clearInterval(heartbeat));
server.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => {
  console.log('DrawLink läuft auf Port ' + (process.env.PORT || 3000));
});
