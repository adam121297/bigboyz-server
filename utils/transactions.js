const { getFirestore } = require('firebase-admin/firestore');

exports.create = async (transactionId, transaction) => {
  const firestore = getFirestore();

  await firestore
    .collection('transactions')
    .doc(transactionId)
    .set(transaction);

  return true;
};

exports.update = async (transactionId, status) => {
  const firestore = getFirestore();

  await firestore.collection('transactions').doc(transactionId).update({
    'payment.status': status
  });

  return true;
};

exports.get = async (transactionId) => {
  const firestore = getFirestore();

  const rawData = await firestore
    .collection('transactions')
    .doc(transactionId)
    .get();

  return rawData.data();
};
