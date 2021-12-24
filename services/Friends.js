import { ObjectId } from "bson";
import redis from "redis";
import { redisHost, usersMap } from "../chatServer.js";

const client = redis.createClient({ host: redisHost });

const requestResponse = (success, message) => {
  const response = {
    success: success,
    message: message,
  };

  return response;
}

export const sendFriendRequest = (res, body, db) => {
  // find id of user being sent the request
  db.collection("users")
    .findOne({ email: body.email }, function (err, to) {
      if (to) {
        db.collection("sessions")
          .findOne({ "session.uuid": body.cookie }, function (err, session) {
            if (session) {
              // find id of user sending the request
              db.collection("users")
                .findOne({ _id: new ObjectId(session.session.userId) }, function (err, from) {
                  if (from) {
                    const friendRequest = {
                      from: from._id.toString(),
                      to: to._id.toString(),
                    };

                    // opposite from and to
                    const friendRequest2 = {
                      from: to._id.toString(),
                      to: from._id.toString(),
                    };

                    // check if friend request already exists
                    db.collection("FriendRequests")
                      .findOne(friendRequest, function (err, request) {
                        if (request) {
                          res.send(requestResponse(false, "You have already sent a friend request to this user."));
                        } else {

                          // check if the user being sent the request has already sent one
                          db.collection("FriendRequests")
                            .findOne(friendRequest2, function (err, request2) {
                              if (request2) {
                                res.send(requestResponse(false, "This user has sent you a friend request already."));
                              } else {

                                // send friend request
                                db.collection("FriendRequests")
                                  .insertOne(friendRequest)
                                  .then((inserted) => {
                                    publishRedisFriendRequest(to._id.toString(), from.email, db);
                                    res.send(requestResponse(true, "Friend request sent."));
                                  })
                                  .catch(() => {
                                    res.send(requestResponse(false, "Sorry, there was an error sending the friend request."));
                                  })
                              }
                            })
                        }
                      });
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

const publishRedisFriendRequest = (toId, fromEmail, db) => {
  db.collection("sessions")
    .findOne({ "session.userId" : toId }, function(err, session) {
      if (session) {
        if (usersMap.has(session.session.uuid)) {
          const data = {
            to: session.session.uuid,
            from: fromEmail,
            type: 'FRIEND_REQUEST',
          };

          (async () => {
            await client.connect();
            await client.publish('notifications', JSON.stringify(data));
            await client.disconnect();
          })();
        }
      } else {
        console.log("user not connected.");
      }
    })
};