import bcrypt from 'bcryptjs';

function response(status, cookie, message) {
  const response = {
    success: status,
    cookie,
    message,
  }

  return response;
}

function createUser(res, body, db) {
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
        .then((inserted) => console.log(inserted))
        .catch(() => res.send(false, '', 'Sorry, there was an error creating your account.'));
    })
  });
}

export const signup = (res, body, db) => {
  db.collection('users')
    .findOne({email: body.email})
    .then((user) => {
      if (user) res.send(response(false, '', 'Email is already registered.'));
      else createUser(res, body, db);
    })
    .catch(() => {
      res.send(response(false, '', 'Email is already registered.'));
    });
};