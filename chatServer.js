import redis from "redis";
import { WebSocketServer } from "ws";

const redisHost = 'redis';
const client = redis.createClient({ host: redisHost });

const wss = new WebSocketServer({ path: '/socket', port: 4004 });

wss.on('connection', (ws) => {
  console.log('connected');
  
  ws.on('close', () => {
    console.log('disconnected');
  });
});

client.subscribe('notifications');
console.log('chat server online');