import express from 'express';
import cors from 'cors';
import { signup } from './services/Signup.js';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { getUser } from './services/User.js';
import { logout } from './services/Logout.js';
import { login } from './services/Login.js';
import {
  sendFriendRequest,
  getRequests, 
  acceptFriendRequest, 
  declineFriendRequest
} from './services/Friends/FriendRequest.js';
import {
  getFriends,
  removeFriend,
} from './services/Friends/FriendList.js';

dotenv.config();

const app = express();
const port = 8080;

const db_url = process.env.DB_URL;
const dbName = 'chat';
const client = new MongoClient(db_url);

app.use(express.json());
app.use(cors());
app.use(session({
  secret: process.env.SECRET,
  saveUninitialized: false,
  resave: false,
  store: MongoStore.create({
    mongoUrl: db_url,
    dbName: dbName,
    ttl: 14 * 24 * 60 * 60,
    stringify: false,
  })
}));

client.connect((error) => {
  const db = client.db(dbName);

  app.post('/signup', (req, res) => {
    const body = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
    };

    signup(req, res, body, db);
  });

  app.post('/logout', (req, res) => {
    const { sessionId } = req.body;

    logout(res, sessionId, db);
  });

  app.post('/login', (req, res) => {
    const body = {
      email: req.body.email,
      password: req.body.password,
    }

    login(req, res, db, body);
  });

  app.post('/sendFriendRequest', (req, res) => {
    const body = {
      cookie: req.body.cookie,
      email: req.body.email,
    }

    sendFriendRequest(res, body, db);
  });

  app.post('/acceptFriendRequest', (req, res) => {
    const body = {
      to: req.body.to,
      from: req.body.from,
    };

    acceptFriendRequest(res, body, db);
  });

  app.post('/declineFriendRequest', (req, res) => {
    const body = {
      to: req.body.to,
      from: req.body.from,
    };

    declineFriendRequest(res, body, db);
  });

  app.post('/removeFriend', (req, res) => {
    const { cookie, friend, owner } = req.body;

    if (cookie !== undefined && cookie !== '') {
      removeFriend(res, friend, owner, db);
    } else {
      res.send({});
    }
  });

  app.get('/getUser', (req, res) => {
    const { cookie } = req.query;
    if (cookie !== undefined && cookie !== '') {
      getUser(res, cookie, db);
    } else {
      res.send({});
    }
  });

  app.get('/getRequests', (req, res) => {
    const { cookie } = req.query;
    if (cookie !== undefined && cookie !== '') {
      getRequests(res, cookie, db);
    } else {
      res.send({});
    }
  });

  app.get('/getFriends', (req, res) => {
    const { cookie } = req.query;
    if (cookie !== undefined && cookie !== '') {
      getFriends(res, cookie, db);
    } else {
      res.send({});
    }
  });

  app.listen(port, () => {
    console.log(`server start at port ${port}`);
  });
});