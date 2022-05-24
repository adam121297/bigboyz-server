const midtrans = require('midtrans-client');
const { v4: uuid } = require('uuid');
const { format, addMinutes } = require('date-fns');

const transactions = require('../utils/transactions');

const apiKey = process.env.API_KEY;
const clientKey = process.env.MIDTRANS_CLIENT_KEY;
const serverKey = process.env.MIDTRANS_SERVER_KEY;
const midtransNotificationUrl = process.env.MIDTRANS_NOTIFICATION_URL;
const paymentTimeout = process.env.PAYMENT_TIMEOUT;

exports.create = async (req, res) => {
  const snap = new midtrans.Snap({
    isProduction: false,
    clientKey,
    serverKey
  });

  snap.httpClient.http_client.defaults.headers.common[
    'X-Override-Notification'
  ] = `${midtransNotificationUrl}?key=${apiKey}`;

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
      unit: 'minutes',
      duration: paymentTimeout
    },
    custom_field1: JSON.stringify(product),
    custom_field2: JSON.stringify(user)
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
      expiredAt: addMinutes(currentTimestamp, paymentTimeout).getTime()
    }
  };

  await transactions.create(transactionId, transaction);

  res.status(200).send({ url });
};
