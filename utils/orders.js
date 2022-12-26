const { isBefore, format, isToday, addMinutes } = require('date-fns');
const { getFirestore } = require('firebase-admin/firestore');
const transactions = require('./transactions');
const notifications = require('./notifications');
const midtrans = require('./midtrans');

const paymentTimeout = process.env.PAYMENT_TIMEOUT;

const createPayment = async (doc, currentTimestamp) => {
  const discount = doc.discount && doc.price * (doc.discount / 100);
  const totalPrice = discount ? doc.price - discount : doc.price;

  const transactionId = (
    currentTimestamp +
    Math.floor(Math.random() * 900000) +
    100000
  ).toString();

  const parameter = {
    transaction_details: {
      order_id: transactionId,
      gross_amount: totalPrice
    },
    item_details: [
      {
        id: String(doc.id).split('-')[0],
        price: doc.price,
        quantity: 1,
        name: doc.name,
        merchant_name: 'BigBoyz'
      }
    ],
    customer_details: {
      first_name: doc.user.name,
      email: doc.user.email
    },
    enabled_payments: ['bank_transfer'],
    user_id: doc.user.id,
    callbacks: { finish: '?finish' },
    expiry: {
      start_time: format(currentTimestamp, 'yyyy-MM-dd HH:mm:ss xx'),
      unit: 'minutes',
      duration: paymentTimeout
    },
    custom_field1: JSON.stringify({
      discount: doc.discount,
      duration: doc.duration,
      id: String(doc.id).split('-')[0],
      image: doc.image,
      name: doc.name,
      price: doc.price,
      variant: doc.variant
    }),
    custom_field2: JSON.stringify(doc.user),
    custom_field3: doc.id
  };

  const url = await midtrans.create(parameter);

  const transaction = {
    user: doc.user,
    product: {
      discount: doc.discount,
      duration: doc.duration,
      id: String(doc.id).split('-')[0],
      image: doc.image,
      name: doc.name,
      price: doc.price,
      variant: doc.variant
    },
    payment: {
      createdAt: currentTimestamp,
      expiredAt: addMinutes(currentTimestamp, 1).getTime(),
      link: url,
      name: 'Transfer Bank',
      status: 'Menunggu Pembayaran'
    }
  };

  await transactions.create(transactionId, transaction);

  notifications.send(doc.user.id, {
    id: transactionId,
    title: 'Menunggu Pembayaran',
    body: `Transaksi untuk perpanjangan ${doc.name} sedang menunggu pembayaran`,
    type: 'information'
  });

  return true;
};

exports.create = async (orderId, order) => {
  try {
    const firestore = getFirestore();

    await firestore.collection('orders').doc(orderId).set(order);

    return true;
  } catch (error) {
    return { error };
  }
};

exports.update = async (orderId, order) => {
  try {
    const firestore = getFirestore();

    await firestore.collection('orders').doc(orderId).update(order);

    return true;
  } catch (error) {
    return { error };
  }
};

exports.check = async () => {
  try {
    const firestore = getFirestore();

    const currentTimestamp = Date.now();

    const col = firestore.collection('orders');
    const rawData = await col.get();

    const data = rawData.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data()
      };
    });

    let expiredOrders = [];
    data.forEach((doc) => {
      if (isToday(doc.expiredAt)) {
        if (doc.subscribtion) {
          createPayment(doc, currentTimestamp);
        }
      } else if (isBefore(doc.expiredAt, currentTimestamp)) {
        expiredOrders.push(col.doc(doc.id).delete());
      }
    });

    await Promise.allSettled(expiredOrders);

    return { numExpired: expiredOrders.length };
  } catch (error) {
    return { error };
  }
};
