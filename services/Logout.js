export const logout = (res, sessionId, db) => {
  db.collection('sessions')
    .findOne({"session.uuid": sessionId}, function(err, session) {
      if (session) {
        db.collection('sessions')
          .deleteOne({"session.uuid": sessionId}, function(err, result) {
            if (result.deletedCount === 1) res.send(true);
            else res.send(false);
          });
      }
      else {
        res.send(false);
      }
    })
};