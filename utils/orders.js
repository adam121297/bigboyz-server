const { isBefore, format, isToday, addMinutes } = require('date-fns');
const { getFirestore } = require('firebase-admin/firestore');
const transactions = require('./transactions');
const notifications = require('./notifications');
const midtrans = require('./midtrans');
const currency = require('currency.js');

const createPayment = async (doc, currentTimestamp) => {
  const discount = doc.discount && doc.price * (doc.discount / 100);
  const totalPrice = discount ? doc.price - discount : doc.price;

  const ppn = (totalPrice * 11) / 100;

  const transactionId = (
    currentTimestamp +
    Math.floor(Math.random() * 900000) +
    100000
  ).toString();

  const item_details = discount
    ? [
        {
          id: doc.id,
          price: currency(doc.price, { precision: 0 }),
          quantity: 1,
          name: `Perpanjangan ${doc.name}`,
          category: doc.category
        },
        {
          id: `${doc.id}-discount`,
          price: currency(-discount, { precision: 0 }),
          quantity: 1,
          name: 'Potongan Harga'
        },
        {
          id: `${doc.id}-ppn`,
          price: currency(ppn, { precision: 0 }),
          quantity: 1,
          name: 'PPN'
        }
      ]
    : [
        {
          id: doc.id,
          price: currency(doc.price, { precision: 0 }),
          quantity: 1,
          name: `Perpanjangan ${doc.name}`,
          category: doc.category
        },
        {
          id: `${doc.id}-ppn`,
          price: currency(ppn, { precision: 0 }),
          quantity: 1,
          name: 'PPN'
        }
      ];

  const parameter = {
    transaction_details: {
      order_id: transactionId,
      gross_amount: currency(totalPrice + ppn, { precision: 0 })
    },
    item_details,
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
      duration: 1440 - 1
    },
    custom_field1: JSON.stringify({
      discount: doc.discount,
      duration: doc.duration,
      id: String(doc.id).split('-')[0],
      image: doc.image,
      category: doc.category,
      name: doc.name,
      price: doc.price,
      variant: doc.variant
    }),
    custom_field2: JSON.stringify(doc.user),
    custom_field3: doc.id
  };

  const url = await midtrans.create(parameter);
  console.log(url);

  const transaction = {
    user: doc.user,
    product: {
      discount: doc.discount,
      duration: doc.duration,
      id: String(doc.id).split('-')[0],
      image: doc.image,
      name: `Perpanjangan ${doc.name}`,
      category: doc.category,
      price: currency(doc.price, { precision: 0 }),
      variant: doc.variant
    },
    payment: {
      createdAt: currentTimestamp,
      expiredAt: addMinutes(currentTimestamp, 1440 - 1).getTime(),
      link: url,
      name: 'Transfer Bank',
      status: 'Menunggu Pembayaran'
    }
  };

  await transactions.create(transactionId, transaction);

  notifications.send(doc.user.id, {
    id: transactionId,
    title: 'Menunggu Pembayaran',
    body: `Transaksi untuk Perpanjangan ${doc.name} sedang menunggu pembayaran`,
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
        notifications.send(doc.user.id, {
          id: doc.id,
          title: 'Segera Habis',
          body: `Layanan ${doc.name} akan habis besok`,
          type: 'information'
        });

        if (doc.subscribtion) {
          createPayment(doc, currentTimestamp);
        }
      } else if (isBefore(doc.expiredAt, currentTimestamp)) {
        notifications.send(doc.user.id, {
          id: doc.id,
          title: 'Layanan Habis',
          body: `Layanan ${doc.name} telah habis`,
          type: 'information'
        });

        expiredOrders.push(col.doc(doc.id).delete());
      }
    });

    await Promise.allSettled(expiredOrders);

    return { numExpired: expiredOrders.length };
  } catch (error) {
    return { error };
  }
};
