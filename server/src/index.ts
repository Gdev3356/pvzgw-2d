// server/src/index.ts
import { createServer } from 'http';
import { Server } from 'socket.io';
import { startRoom } from './room';

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '127.0.0.1'; // Nginx proxies to this from outside; nothing else needs to reach it directly
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const httpServer = createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('ok');
        return;
    }
    res.writeHead(404);
    res.end();
});

const io = new Server(httpServer, {
    cors: {
        origin: CLIENT_ORIGIN,
        methods: ['GET', 'POST'],
    },
});

startRoom(io);

httpServer.listen(PORT, HOST, () => {
    console.log(`[server] listening on http://${HOST}:${PORT} (accepting clients from ${CLIENT_ORIGIN})`);
});
