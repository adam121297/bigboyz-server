const users = require('../utils/users');

exports.save = async (req, res) => {
  const { user } = req.body;

  if (!user) {
    res.status(400).send({
      error: 'Invalid data',
      code: '400',
      message: 'user data is required'
    });
    return false;
  }

  const userId = user.uid;
  await users.save(userId, user);

  res.status(200).send({
    message: 'User updated',
    data: user
  });
};
