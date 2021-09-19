import express from 'express';
import cors from 'cors';
import { signup } from './services/Signup.js';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

const app = express();
const port = 8080;

const db_url = process.env.DB_URL;
const dbName = 'chat';
const client = new MongoClient(db_url);

app.use(express.json());
app.use(cors());

client.connect((error) => {
  const db = client.db(dbName);

  app.post('/signup', (req, res) => {
    const body = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
    };
  
    signup(res, body, db);
  }); 
  
  app.listen(port, () => {
    console.log(`server start at port ${port}`);
  });
});