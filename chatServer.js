import redis from "redis";
import { WebSocketServer } from "ws";

const redisHost = 'redis';
const client = redis.createClient({ host: redisHost });

const wss = new WebSocketServer({ port: 4004 });
const users = new Map();

wss.on('connection', (ws, req) => {
  console.log('connected');
  users.set(req.url.slice(1), ws);

  ws.on('close', () => {
    console.log('disconnected');
    users.delete(req.url.slice(1));
  });
});

client.subscribe('notifications');
console.log('chat server online');