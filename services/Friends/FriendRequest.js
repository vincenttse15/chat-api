import { ObjectId } from "bson";
import redis from "redis";
import { redisHost, usersMap } from "../../chatServer.js";

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
                      from: from.email,
                      to: to.email,
                    };

                    // opposite from and to
                    const friendRequest2 = {
                      from: to.email,
                      to: from.email,
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

                                //check if they are friends already
                                db.collection("Friends")
                                  .findOne({ owner: from.email, friend: to.email }, function (err, friend) {
                                    if (friend) {
                                      res.send(requestResponse(false, "You are friends with this user."));
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
    .findOne({ "session.userId": toId }, function (err, session) {
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
      }
    })
};

export const getRequests = (res, sessionId, db) => {
  db.collection("sessions")
    .findOne({ "session.uuid": sessionId }, function (err, session) {
      if (session) {
        db.collection("users")
          .findOne({ _id: new ObjectId(session.session.userId) }, function (err, user) {
            if (user) {
              const query = {
                to: user.email,
              };

              const projection = {
                _id: 0,
                from: 1,
              };

              db.collection("FriendRequests")
                .find(query)
                .project(projection)
                .toArray()
                .then((requests) => {
                  res.send(requests);
                })
                .catch(() => {
                  res.send({})
                })
            } else {
              res.send({});
            }
          });
      } else {
        res.send({});
      }
    });
};

export const acceptFriendRequest = (res, body, db) => {
  const query = {
    to: body.to,
    from: body.from,
  };

  db.collection("FriendRequests")
    .deleteOne(query, function (err, result) {
      if (result.deletedCount === 1) {
        const doc1 = {
          owner: body.to,
          friend: body.from,
        };

        const doc2 = {
          owner: body.from,
          friend: body.to,
        };

        db.collection("Friends")
          .insertOne(doc1)
          .then((inserted) => {
            db.collection("Friends")
              .insertOne(doc2)
              .then((inserted) => {
                publishRedisAcceptFriendRequest(body, db);
                db.collection("users")
                  .findOne({ email: body.from })
                  .then((user) => {
                    const data = {
                      email: user.email,
                      firstName: user.firstName,
                      lastName: user.lastName,
                      success: true,
                    };

                    res.send(data);
                  })
                  .catch(() => {
                    res.send({ success: false });
                  })
              })
              .catch(() => res.send({ success: false }));
          })
          .catch(() => res.send({ success: false }));
      } else {
        res.send({ success: false });
      }
    })
};

const publishRedisAcceptFriendRequest = (body, db) => {
  db.collection("users")
    .findOne({ email: body.from }, { sort: {}, projection: { _id: 1 } })
    .then((user) => {
      db.collection("sessions")
        .findOne({ "session.userId": user._id.toString() })
        .then((session) => {
          if (usersMap.has(session.session.uuid)) {
            const projection = {
              _id: 0,
              firstName: 1,
              lastName: 1
            };

            db.collection("users")
              .findOne({ email: body.to }, { sort: {}, projection: projection })
              .then((newFriend) => {
                const data = {
                  to: session.session.uuid,
                  firstName: newFriend.firstName,
                  lastName: newFriend.lastName,
                  email: body.to,
                  type: "ADD_NEW_FRIEND",
                };

                (async () => {
                  await client.connect();
                  await client.publish('notifications', JSON.stringify(data));
                  await client.disconnect();
                })();
              })
              .catch(() => {
                console.log("error user find");
              })
          }
        })
        .catch(() => {
          console.log("error sesson find");
        })
    })
    .catch(() => {
      console.log("error user find");
    });
};

export const declineFriendRequest = (res, body, db) => {
  const query = {
    to: body.to,
    from: body.from,
  };

  db.collection("FriendRequests")
    .deleteOne(query, function(err, result) {
      if (result.deletedCount === 1) {
        res.send({ success: true });
      } else {
        res.send({ success: false });
      }
    })
}