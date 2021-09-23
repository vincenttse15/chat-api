import bcrypt from 'bcryptjs';
import { sessionResponse, createSession } from './Session.js';

function createUser(req, res, body, db) {
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(body.password, salt, function(err, hash) {
      const user = {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        salt: salt,
        passwordHash: hash,
      }

      db.collection('users')
        .insertOne(user)
        .then((inserted) => createSession(req, res, inserted))
        .catch(() => res.send(sessionResponse(false, '', 'Sorry, there was an error creating your account.')));
    })
  });
}

export const signup = (req, res, body, db) => {
  db.collection('users')
    .findOne({email: body.email})
    .then((user) => {
      if (user) res.send(sessionResponse(false, '', 'Email is already registered.'));
      else createUser(req, res, body, db);
    })
    .catch(() => {
      res.send(sessionResponse(false, '', 'Email is already registered.'));
    });
};