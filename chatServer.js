import redis from "redis";
import { WebSocketServer } from "ws";

export const redisHost = 'redis';
const client = redis.createClient({ host: redisHost });

(async () => {
  await client.connect();
})();

const wss = new WebSocketServer({ port: 4004 });
export const usersMap = new Map();

wss.on('connection', (ws, req) => {
  console.log('connected');
  usersMap.set(req.url.slice(1), ws);

  ws.on('close', () => {
    console.log('disconnected');
    usersMap.delete(req.url.slice(1));
  });
});

await client.subscribe('notifications', (message) => {
  console.log(message);
});

console.log('chat server online');