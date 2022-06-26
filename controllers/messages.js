const messages = require('../utils/messages');

exports.acceptPending = async (req, res) => {
  const chatRoomId = req.params.id;
  const { adminId } = req.body;

  await messages.acceptPending(chatRoomId, adminId);

  res.status(200).send('Ok');
};
