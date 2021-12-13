import {v4 as uuidv4} from 'uuid';

export const sessionResponse = (status, cookie, message) => {
  const response = {
    success: status,
    cookie,
    message,
  }

  return response;
}

export const createSession = (req, res, inserted) => {
  const uuid = uuidv4();
  req.session.uuid = uuid;
  req.session.userId = inserted.insertedId;

  req.session.save(err => {
    if (err) {
      res.send(sessionResponse(false, '', 'Error saving session.'));
    } else {
      res.send(sessionResponse(true, uuid, ''));
    }
  });
}