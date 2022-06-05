const users = require('../utils/users');

exports.save = async (req, res) => {
  const userId = req.params.id;
  const { user, FCMToken } = req.body;

  if (!user) {
    res.status(400).send({
      error: 'Invalid data',
      code: '400',
      message: 'User is required'
    });
    return false;
  }

  if (!FCMToken) {
    res.status(400).send({
      error: 'Invalid data',
      code: '400',
      message: 'FCMToken is required'
    });
    return false;
  }

  const status = await users.save(userId, user, FCMToken);

  if (status.error) {
    res.status(500).send({
      error: 'Server error',
      code: '500',
      message:
        'User update error, please contact your server admin for detailed information'
    });
    return false;
  }

  res.status(200).send({
    message: 'User updated',
    data: user
  });
};
