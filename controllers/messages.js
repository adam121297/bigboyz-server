const messages = require('../utils/messages');

exports.acceptPending = async (req, res) => {
  const chatRoomId = req.params.id;
  const { adminId } = req.body;

  const status = await messages.acceptPending(chatRoomId, adminId);

  if (status.error) {
    console.log('Messages handling error: ', status.error);

    res.status(500).send({
      error: 'Server error',
      code: '500',
      message:
        'Messages handling error, please contact your server admin for detailed information'
    });
    return;
  }

  res
    .status(200)
    .send({ message: 'Pending messages accepted', data: chatRoomId });
};
