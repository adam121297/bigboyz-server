const { addMinutes, isBefore } = require('date-fns');
const { getFirestore } = require('firebase-admin/firestore');
const transactions = require('./transactions');
const midtrans = require('./midtrans');

const paymentTimeout = process.env.PAYMENT_TIMEOUT;

const createPayment = async (doc, currentTimestamp) => {
  const discount = doc.discount && doc.price * (doc.discount / 100);
  const totalPrice = discount ? doc.price - discount : doc.price;

  const parameter = {
    transaction_details: {
      order_id: `PAY-${doc.id}`,
      gross_amount: totalPrice
    },
    item_details: [
      {
        id: doc.id,
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
      start_time: currentTimestamp,
      unit: 'minutes',
      duration: paymentTimeout
    },
    custom_field1: JSON.stringify({
      discount: doc.discount,
      duration: doc.duration,
      id: doc.id,
      image: doc.image,
      name: doc.name,
      price: doc.price,
      variant: doc.variant
    }),
    custom_field2: JSON.stringify(doc.user)
  };

  const url = await midtrans.create(parameter);

  const transaction = {
    user: doc.user,
    product: {
      discount: doc.discount,
      duration: doc.duration,
      id: doc.id,
      image: doc.image,
      name: doc.name,
      price: doc.price,
      variant: doc.variant
    },
    payment: {
      createdAt: currentTimestamp,
      expiredAt: addMinutes(currentTimestamp, paymentTimeout).getTime(),
      link: url,
      name: 'Transfer Bank',
      status: 'Menunggu Pembayaran'
    }
  };

  return await transactions.create(`PAY-${doc.id}`, transaction);
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

exports.check = async () => {
  try {
    const firestore = getFirestore();

    const currentTimestamp = Date.now();
    const rawData = await firestore.collection('orders').get();

    const data = rawData.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data()
      };
    });

    let numExpired = 0;
    data.forEach((doc) => {
      if (isBefore(doc.expiredAt)) {
        numExpired++;
        createPayment(doc, currentTimestamp);
      }
    });

    return { numExpired };
  } catch (error) {
    return { error };
  }
};
