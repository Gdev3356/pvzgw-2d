// src/utils/network.ts — client-side socket connection.
// Deliberately separate from anything under server/ — this is the browser
// counterpart, using socket.io-client, never socket.io.

import { io, Socket } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export const socket: Socket = io(SERVER_URL, {
    autoConnect: false, // we connect explicitly once GameCanvas is ready, not on import
});
