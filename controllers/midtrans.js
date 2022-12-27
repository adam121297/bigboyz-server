const midtrans = require('../utils/midtrans');
const transactions = require('../utils/transactions');
const notifications = require('../utils/notifications');
const orders = require('../utils/orders');
const { addHours, addDays } = require('date-fns');

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

  const orderId = rawData.custom_field3 || `${product.id}-${currentTimestamp}`;
  const order = {
    name: product.name,
    category: product.category,
    image: product.image,
    price: product.price,
    discount: product.discount,
    user,
    status: 'Layanan Aktif',
    subscribtion: product.variant === 'Berlangganan' ? true : false,
    duration: product.duration, // hours
    variant: product.variant,
    expiredAt: rawData.custom_field3
      ? addDays(addHours(currentTimestamp, product.duration), 1)
      : addHours(currentTimestamp, product.duration)
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
      if (rawData.custom_field3) {
        orders.update(orderId, order);
      } else {
        orders.create(orderId, order);
      }

      await transactions.update(transactionId, 'Transaksi Berhasil');
      notifications.send(user.id, {
        id: transactionId,
        title: 'Transaksi Berhasil',
        body: `Transaksi untuk ${product.name} berhasil`,
        type: 'information'
      });
    }
  } else if (transactionStatus === 'settlement') {
    if (rawData.custom_field3) {
      orders.update(orderId, order);
    } else {
      orders.create(orderId, order);
    }

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
