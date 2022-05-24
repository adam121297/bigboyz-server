const midtrans = require('midtrans-client');

const transactions = require('../utils/transactions');
const messages = require('../utils/messages');

const clientKey = process.env.MIDTRANS_CLIENT_KEY;
const serverKey = process.env.MIDTRANS_SERVER_KEY;

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
    counter: 1,
    expiredAt: 0,
    duration: product.duration
  };

  if (transactionStatus === 'capture') {
    if (fraudStatus === 'challenge') {
      await transactions.update(transactionId, 'Transaksi Gagal');
    } else if (fraudStatus === 'accept') {
      await transactions.update(transactionId, 'Transaksi Berhasil');
      await messages.createRoom(chatRoomId, chatRoom);
    }
  } else if (transactionStatus === 'settlement') {
    await transactions.update(transactionId, 'Transaksi Berhasil');
    await messages.createRoom(chatRoomId, chatRoom);
  } else if (transactionStatus === 'cancel' || transactionStatus == 'deny') {
    await transactions.update(transactionId, 'Transaksi Gagal');
  } else if (transactionStatus === 'pending') {
    await transactions.update(transactionId, 'Menunggu Pembayaran');
  } else if (transactionStatus === 'expire') {
    await transactions.update(transactionId, 'Transaksi Kadaluarsa');
  }

  res.status(200).send('Ok');
};
