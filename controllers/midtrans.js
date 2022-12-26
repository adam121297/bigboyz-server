const midtrans = require('../utils/midtrans');
const transactions = require('../utils/transactions');
const notifications = require('../utils/notifications');
const orders = require('../utils/orders');

/**
 * Handle midtrans webhook
 */
exports.handle = async (req, res) => {
  const rawData = await midtrans.getNotification(req.body);
  if (rawData.error) {
    console.log('Transaction update error: ', rawData.error);

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

  const orderId = `${user.id}-${product.id}`;
  const order = {
    name: product.name,
    image: product.image,
    user,
    status: 'Aktif',
    subscribtion: product.duration >= 720 ? true : false,
    expiredAt:
      product.duration >= 720
        ? currentTimestamp + product.duration * 12 * 3600000
        : currentTimestamp + product.duration * 3600000
  };

  if (transactionStatus === 'capture') {
    if (fraudStatus === 'challenge') {
      await transactions.update(transactionId, 'Transaksi Gagal');
      notifications.send(user.id, {
        id: transactionId,
        title: 'Transaksi Gagal',
        body: `Transaksi untuk ${product.name} gagal`,
        type: 'information'
      });
    } else if (fraudStatus === 'accept') {
      orders.create(orderId, order);
      await transactions.update(transactionId, 'Transaksi Berhasil');
      notifications.send(user.id, {
        id: transactionId,
        title: 'Transaksi Berhasil',
        body: `Transaksi untuk ${product.name} berhasil`,
        type: 'information'
      });
    }
  } else if (transactionStatus === 'settlement') {
    orders.create(orderId, order);
    await transactions.update(transactionId, 'Transaksi Berhasil');
    notifications.send(user.id, {
      id: transactionId,
      title: 'Transaksi Berhasil',
      body: `Transaksi untuk ${product.name} berhasil`,
      type: 'information'
    });
  } else if (transactionStatus === 'cancel' || transactionStatus == 'deny') {
    await transactions.update(transactionId, 'Transaksi Gagal');
    notifications.send(user.id, {
      id: transactionId,
      title: 'Transaksi Gagal',
      body: `Transaksi untuk ${product.name} gagal`,
      type: 'information'
    });
  } else if (transactionStatus === 'pending') {
    await transactions.update(transactionId, 'Menunggu Pembayaran');
    notifications.send(user.id, {
      id: transactionId,
      title: 'Menunggu Pembayaran',
      body: `Transaksi untuk ${product.name} sedang menunggu pembayaran`,
      type: 'information'
    });
  } else if (transactionStatus === 'expire') {
    await transactions.update(transactionId, 'Transaksi Kadaluarsa');
    notifications.send(user.id, {
      id: transactionId,
      title: 'Transaksi Kadaluarsa',
      body: `Transaksi untuk ${product.name} telah kadaluarsa`,
      type: 'information'
    });
  }

  res.status(200).send('Ok');
};
