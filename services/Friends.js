const requestResponse = (success, message) => {
  const response = {
    success: success,
    message: message,
  };

  return response;
}

export const sendFriendRequest = (res, body, db) => {
  db.collection("users")
    .findOne({email: body.email}, function(err, user) {
      if (user) {
        const data = {
          success: true,
        }

        res.send(data);
      } else {
        res.send(requestResponse(false, "User does not exist."));
      }
    })
};