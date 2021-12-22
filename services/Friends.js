import { ObjectId } from "bson";

const requestResponse = (success, message) => {
  const response = {
    success: success,
    message: message,
  };

  return response;
}

export const sendFriendRequest = (res, body, db) => {
  db.collection("users")
    .findOne({ email: body.email }, function (err, to) {
      if (to) {
        db.collection("sessions")
          .findOne({ "session.uuid": body.cookie }, function (err, session) {
            if (session) {
              db.collection("users")
                .findOne({ _id: new ObjectId(session.session.userId) }, function (err, from) {
                  if (from) {
                    const friendRequest = {
                      from: from._id.toString(),
                      to: to._id.toString(),
                    };

                    db.collection("FriendRequests")
                      .insertOne(friendRequest)
                      .then((inserted) => {
                        res.send(requestResponse(true, "Friend request sent."));
                      })
                      .catch(() => {
                        res.send(requestResponse(false, "Sorry, there was an error sending the friend request."));
                      })
                  } else {
                    res.send(requestResponse(false, "Error, please try again."));
                  }
                });
            } else {
              res.send(requestResponse(false, "Error finding session, please try relogging."));
            }
          })
      } else {
        res.send(requestResponse(false, "User with that email does not exist."));
      }
    })
};