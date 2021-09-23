import { ObjectId } from "bson";

export const getUser = (res, sessionId, db) => {
  db.collection("sessions")
    .findOne({"session.uuid": sessionId}, function(err, session) {
      if(session) {
        db.collection("users")
          .findOne({_id: new ObjectId(session.session.userId)}, function(err, user) {
            if (user) {
              const data = {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
              }

              res.send(data);
            } else {
              res.send({});
            }
          });
      } else {
        res.send({});
      }
    });
};
