import { ObjectId } from "bson";

export const getFriends = (res, sessionId, db) => {
  db.collection("sessions")
    .findOne({ "session.uuid": sessionId }, function (err, session) {
      if (session) {
        db.collection("users")
          .findOne({ _id: new ObjectId(session.session.userId) }, function (err, user) {
            if (user) {
              const query = {
                owner: user.email
              };

              const projection = {
                _id: 0,
                friend: 1,
              };

              db.collection("Friends")
                .find(query)
                .project(projection)
                .toArray()
                .then((friends) => {
                  const promises = [];
                  for (const friend of friends) {
                    promises.push(db.collection("users")
                      .findOne({ email: friend.friend }, { sort: {}, projection: { _id: 0, email: 1, firstName: 1, lastName: 1 } }));
                  }

                  (async () => {
                    if (promises.length > 0) {
                      const data = await Promise.all(promises);
                      res.send(data);
                    } else {
                      res.send([]);
                    }
                  })();
                })
                .catch(() => {
                  res.send({});
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

export const removeFriend = (res, friend, owner, db) => {
  const doc1 = {
    owner: owner,
    friend: friend
  };

  const doc2 = {
    owner: friend,
    friend: owner,
  };

  db.collection("Friends")
    .deleteOne(doc1)
    .then((deleteDoc1) => {
      if (deleteDoc1.deletedCount === 1) {
        db.collection("Friends")
          .deleteOne(doc2)
          .then((deleteDoc2) => {
            if (deleteDoc2.deletedCount === 1) {
              console.log("deleted both");
              res.send({ success: true });
            } else {
              res.send({ success: false });
            }
          })
          .catch(() => {
            res.send({ success: false });
          })
      } else {
        res.send({ success: false })
      }
    })
    .catch(() => {
      res.send({ success: false });
    })
};
