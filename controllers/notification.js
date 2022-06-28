const { getFirestore } = require('firebase-admin/firestore');

exports.send = async (req, res) => {
  const receiver = req.params.receiver;
  const { message } = req.body;

  if (!message) {
    res.status(400).send({
      error: 'Invalid data',
      code: '400',
      message: 'Message required'
    });
    return;
  }

  if (!message.title || !message.text) {
    res.status(400).send({
      error: 'Invalid data',
      code: '400',
      message: 'Message title and text required'
    });
    return;
  }

  try {
    const firestore = getFirestore();
    await firestore.collection('notifications').doc().set({
      receiver,
      message
    });

    res
      .status(200)
      .send({ message: 'Notification queue created', data: message });
  } catch (error) {
    console.log('Send message error: ', error);

    res.status(500).send({
      error: 'Server error',
      code: '500',
      message:
        'Send message error, please contact your server admin for detailed information'
    });
  }
};
