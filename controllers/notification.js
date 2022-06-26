const midtrans = require('midtrans-client');
const { getFirestore } = require('firebase-admin/firestore');

const transactions = require('../utils/transactions');
const messages = require('../utils/messages');
const notifications = require('../utils/notifications');

const clientKey = process.env.MIDTRANS_CLIENT_KEY;
const serverKey = process.env.MIDTRANS_SERVER_KEY;

exports.handle = async (req, res) => {
  const snap = new midtrans.Snap({
    isProduction: false,
    clientKey,
    serverKey
  });

  let rawData;
  try {
    rawData = await snap.transaction.notification(req.body);
  } catch (error) {
    console.log('Transaction update error: ', error);

    res.status(500).send({
      error: 'Server error',
      code: '500',
      message:
        'Transaction update error, please contact your server admin for detailed information'
    });
    return;
  }

  const transactionId = rawData.order_id;
  const transactionStatus = rawData.transaction_status;
  const fraudStatus = rawData.fraud_status;
  const product = JSON.parse(rawData.custom_field1);
  const user = JSON.parse(rawData.custom_field2);

  const currentTimestamp = Date.now();
  const chatRoomId = `${user.id}-${product.id}`;
  const chatRoom = {
    name: product.name,
    image: product.image,
    users: [user],
    latestMessage: {
      id: `system-${currentTimestamp}`,
      text: 'Sesi konsultasi akan segera dimulai',
      sender: 'System',
      timestamp: currentTimestamp
    },
    expiredAt: 0,
    duration: product.duration
  };

  if (transactionStatus === 'capture') {
    if (fraudStatus === 'challenge') {
      await transactions.update(transactionId, 'Transaksi Gagal');
      await notifications.send(user.id, 'Transaksi Gagal', 'Transaksi gagal');
    } else if (fraudStatus === 'accept') {
      await transactions.update(transactionId, 'Transaksi Berhasil');
      await messages.createRoom(chatRoomId, chatRoom);
      await notifications.send(
        user.id,
        'Transaksi Berhasil',
        'Transaksi berhasil'
      );
    }
  } else if (transactionStatus === 'settlement') {
    await transactions.update(transactionId, 'Transaksi Berhasil');
    await messages.createRoom(chatRoomId, chatRoom);
    await notifications.send(
      user.id,
      'Transaksi Berhasil',
      'Transaksi berhasil'
    );
  } else if (transactionStatus === 'cancel' || transactionStatus == 'deny') {
    await transactions.update(transactionId, 'Transaksi Gagal');
    await notifications.send(user.id, 'Transaksi Gagal', 'Transaksi gagal');
  } else if (transactionStatus === 'pending') {
    await transactions.update(transactionId, 'Menunggu Pembayaran');
    await notifications.send(
      user.id,
      'Menunggu Pembayaran',
      'Menunggu pembayaran'
    );
  } else if (transactionStatus === 'expire') {
    await transactions.update(transactionId, 'Transaksi Kadaluarsa');
    await notifications.send(
      user.id,
      'Transaksi Kadaluarsa',
      'Transaksi kadaluarsa'
    );
  }

  res.status(200).send('Ok');
};

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

    res.status(200).send('Ok');
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
