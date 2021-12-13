import bcrypt from 'bcryptjs';
import { createSession } from './Session.js';

const loginResponse = (status, message) => {
  const response = {
    status,
    message,
  }

  return response;
}

function checkPassword(req, res, user, body) {
  bcrypt.hash(body.password, user.salt, function (err, hash) {
    if (hash === user.passwordHash) {
      const data = {
        insertedId: user._id.toString(),
      }
      
      createSession(req, res, data);
    } else {
      res.send(loginResponse(false, 'Incorrect password'));
    }
  })
}

export const login = (req, res, db, body) => {
  db.collection("users")
    .findOne({"email": body.email}, function(err, user) {
      if (user) {
        checkPassword(req, res, user, body);
      } else {
        res.send(loginResponse(false, 'Email does not exist'));
      }
    }); 
};