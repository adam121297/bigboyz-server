const midtrans = require('midtrans-client');

const apiKey = process.env.API_KEY;
const midtransProd = process.env.MIDTRANS_PRODUCTION;
const clientKey = process.env.MIDTRANS_CLIENT_KEY;
const serverKey = process.env.MIDTRANS_SERVER_KEY;
const midtransNotificationUrl = process.env.MIDTRANS_NOTIFICATION_URL;

const snap = new midtrans.Snap({
  isProduction: midtransProd ? true : false,
  clientKey,
  serverKey
});

snap.httpClient.http_client.defaults.headers.common[
  'X-Override-Notification'
] = `${midtransNotificationUrl}?key=${apiKey}`;

exports.create = async (parameter) => {
  try {
    return await snap.createTransactionRedirectUrl(parameter);
  } catch (error) {
    return { error };
  }
};

exports.cancel = async (transactionId) => {
  try {
    await snap.transaction.cancel(transactionId);

    return true;
  } catch (error) {
    return { error };
  }
};
