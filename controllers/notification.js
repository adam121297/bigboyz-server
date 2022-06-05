const midtrans = require('midtrans-client');

const transactions = require('../utils/transactions');
const messages = require('../utils/messages');
const notifications = require('../utils/notifications');

const clientKey = process.env.MIDTRANS_CLIENT_KEY;
const serverKey = process.env.MIDTRANS_SERVER_KEY;

exports.send = async (req, res) => {
  const uid = 'TEjIRjW7U4Ntuk8PWJtwLtjRnYo1';
  try {
    await notifications.send(uid, 'Halo', 'Ini oesan test');
    res.send('OK');
  } catch (error) {
    res.send(error);
  }
};

exports.handle = async (req, res) => {
  const snap = new midtrans.Snap({
    isProduction: false,
    clientKey,
    serverKey
  });

  const rawData = await snap.transaction.notification(req.body);

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
    users: [user.id],
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
      'Transaksi menunggu pembayaran'
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
