// server/src/index.ts
import { createServer } from 'http';
import { Server } from 'socket.io';
import { startRoom } from './room';

const PORT = Number(process.env.PORT) || 3001;
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

httpServer.listen(PORT, () => {
    console.log(`[server] listening on http://localhost:${PORT} (accepting clients from ${CLIENT_ORIGIN})`);
});
