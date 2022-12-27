const { getFirestore } = require('firebase-admin/firestore');

const midtrans = require('../utils/midtrans');

module.exports = () => {
  const firestore = getFirestore();

  /**
   * Handle transactions
   */
  firestore.collection('transactions').onSnapshot((snapshot) => {
    if (snapshot.empty) {
      return;
    }

    // Cancel transaction
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'modified') {
        if (change.doc.data().payment.status === 'cancel') {
          midtrans.cancel(change.doc.id);
        }
      }
    });
  });
};
