const messages = require('../utils/messages');
const notifications = require('../utils/notifications');

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

  const userId = status.client.id;
  const chatRoomName = status.chatRoom.name;

  notifications.send(
    userId,
    'Sesi Konsultasi Diterima',
    `Sesi ${chatRoomName} sudah dimulai`
  );

  res
    .status(200)
    .send({ message: 'Pending messages accepted', data: chatRoomId });
};
