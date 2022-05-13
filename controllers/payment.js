const midtrans = require('midtrans-client');
const { format } = require('date-fns');

const clientKey = process.env.MIDTRANS_CLIENT_KEY;
const serverKey = process.env.MIDTRANS_SERVER_KEY;

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

  const currentTimestamp = Date.now();
  const createdAt = format(currentTimestamp, 'yyyy-MM-dd HH:mm:ss xx');

  const parameter = {
    transaction_details,
    item_details,
    customer_details,
    enabled_payments,
    credit_card: { secure: true, save_card: true },
    user_id: transaction_details.order_id.split('-')[0],
    callbacks: { finish: '?finish' },
    expiry: {
      start_time: createdAt,
      unit: 'hours',
      duration: 1
    }
  };

  const url = await snap.createTransactionRedirectUrl(parameter);

  res.status(200).send({ url });
};

exports.notification = async (req, res) => {
  const snap = new midtrans.Snap({
    isProduction: false,
    clientKey,
    serverKey
  });

  const rawData = await snap.transaction.notification(req.body);

  let orderId = rawData.order_id;
  let transactionStatus = rawData.transaction_status;
  let fraudStatus = rawData.fraud_status;

  console.log(orderId);

  if (transactionStatus == 'capture') {
    if (fraudStatus == 'challenge') {
      // TODO set transaction status on your database to 'challenge'
      // and response with 200 OK
    } else if (fraudStatus == 'accept') {
      // TODO set transaction status on your database to 'success'
      // and response with 200 OK
    }
  } else if (transactionStatus == 'settlement') {
    // TODO set transaction status on your database to 'success'
    // and response with 200 OK
  } else if (
    transactionStatus == 'cancel' ||
    transactionStatus == 'deny' ||
    transactionStatus == 'expire'
  ) {
    // TODO set transaction status on your database to 'failure'
    // and response with 200 OK
  } else if (transactionStatus == 'pending') {
    // TODO set transaction status on your database to 'pending' / waiting payment
    // and response with 200 OK
  }

  res.status(200).send('Ok');
};
