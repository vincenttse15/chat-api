function response(status, cookie, message) {
  const response = {
    success,
    cookie,
    message,
  }

  return response;
}

export const signup = (res, body, db) => {
  db.collection('users')
    .findOne({email: body.email})
    .then((user) => {
      if (user) res.send(response(false, '', 'Email is already registered.'));
      else res.send('success');
    })
    .catch(() => {
      res.send(response(false, '', 'Email is already registered.'));
    });
};