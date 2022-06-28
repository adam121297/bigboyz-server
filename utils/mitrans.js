const midtrans = require('midtrans-client');

const apiKey = process.env.API_KEY;
const clientKey = process.env.MIDTRANS_CLIENT_KEY;
const serverKey = process.env.MIDTRANS_SERVER_KEY;
const midtransNotificationUrl = process.env.MIDTRANS_NOTIFICATION_URL;

const snap = new midtrans.Snap({
  isProduction: false,
  clientKey,
  serverKey
});

snap.httpClient.http_client.defaults.headers.common[
  'X-Override-Notification'
] = `${midtransNotificationUrl}?key=${apiKey}`;

exports.cancel = async (transactionId) => {
  try {
    await snap.transaction.cancel(transactionId);

    return true;
  } catch (error) {
    return { error };
  }
};
