const midtrans = require('midtrans-client');
const { v4: uuid } = require('uuid');
const { format, addHours } = require('date-fns');
const { getFirestore } = require('firebase-admin/firestore');

const { PAYMENT_DURATION } = require('../configs/payment');

const clientKey = process.env.MIDTRANS_CLIENT_KEY;
const serverKey = process.env.MIDTRANS_SERVER_KEY;

const createTransaction = async (transactionId, transaction) => {
  const firestore = getFirestore();

  try {
    await firestore
      .collection('transactions')
      .doc(transactionId)
      .set(transaction);

    return true;
  } catch (error) {
    return false;
  }
};

exports.create = async (req, res) => {
  const snap = new midtrans.Snap({
    isProduction: false,
    clientKey,
    serverKey
  });

  const {
    transaction_details,
    item_details,
    customer_details,
    enabled_payments
  } = req.body.parameter;

  const { product, user, payment } = req.body.transaction;

  const userId = user.id;
  const transactionId = uuid();

  const currentTimestamp = Date.now();
  const createdAt = format(currentTimestamp, 'yyyy-MM-dd HH:mm:ss xx');

  const parameter = {
    transaction_details: {
      ...transaction_details,
      order_id: transactionId
    },
    item_details,
    customer_details,
    enabled_payments,
    credit_card: { secure: true, save_card: true },
    user_id: userId,
    callbacks: { finish: '?finish' },
    expiry: {
      start_time: createdAt,
      unit: 'hours',
      duration: PAYMENT_DURATION
    }
  };

  const url = await snap.createTransactionRedirectUrl(parameter);

  const transaction = {
    product: {
      ...product
    },
    user: {
      ...user
    },
    payment: {
      ...payment,
      link: url,
      createdAt: currentTimestamp,
      expiredAt: addHours(currentTimestamp, PAYMENT_DURATION).getTime()
    }
  };

  createTransaction(transactionId, transaction);

  res.status(200).send({ url });
};

const updateTransaction = async (transactionId, status) => {
  const firestore = getFirestore();

  try {
    await firestore.collection('transactions').doc(transactionId).update({
      'payment.status': status
    });

    return true;
  } catch (error) {
    return false;
  }
};

exports.notification = async (req, res) => {
  const snap = new midtrans.Snap({
    isProduction: false,
    clientKey,
    serverKey
  });

  const rawData = await snap.transaction.notification(req.body);

  let transactionId = rawData.order_id;
  let transactionStatus = rawData.transaction_status;
  let fraudStatus = rawData.fraud_status;

  if (transactionStatus == 'capture') {
    if (fraudStatus == 'challenge') {
      updateTransaction(transactionId, 'Transaksi Gagal');
    } else if (fraudStatus == 'accept') {
      updateTransaction(transactionId, 'Transaksi Berhasil');
    }
  } else if (transactionStatus == 'settlement') {
    updateTransaction(transactionId, 'Transaksi Berhasil');
  } else if (transactionStatus == 'cancel' || transactionStatus == 'deny') {
    updateTransaction(transactionId, 'Transaksi Gagal');
  } else if (transactionStatus == 'pending') {
    updateTransaction(transactionId, 'Menunggu Pembayaran');
  } else if (transactionStatus == 'expire') {
    updateTransaction(transactionId, 'Transaksi Kadaluarsa');
  }

  res.status(200).send('Ok');
};
