const users = require('./user');
const products = require('./products');
const payments = require('./payments');

exports.transactions = [
  {
    id: Math.ceil(Math.random() * 8999999999 + 1000000000).toString(),
    product: {
      id: products[0].id,
      name: products[0].name,
      price: products[0].price * 1,
      discount: products[0].discounts[1 - 1],
      variant: 1,
      image: ''
    },
    user: {
      id: users[0].id,
      name: users[0].name,
      email: users[0].email
    },
    payment: {
      name: payments[Math.ceil(Math.random() * payments.length - 1)].name,
      link: '',
      status: 'Menunggu Pembayaran',
      createdAt: Date.now() - 15 * 60 * 1000,
      expiredAt: Date.now() + 45 * 60 * 1000
    }
  },
  {
    id: Math.ceil(Math.random() * 8999999999 + 1000000000).toString(),
    product: {
      id: products[1].id,
      name: products[1].name,
      price: products[1].price * 3,
      discount: products[1].discounts[3 - 1],
      variant: 3,
      image: ''
    },
    user: {
      id: users[0].id,
      name: users[0].name,
      email: users[0].email
    },
    payment: {
      name: payments[Math.ceil(Math.random() * payments.length - 1)].name,
      link: '',
      status: 'Menunggu Pembayaran',
      createdAt: Date.now() - 25 * 60 * 1000,
      expiredAt: Date.now() + 35 * 60 * 1000
    }
  },
  {
    id: Math.ceil(Math.random() * 8999999999 + 1000000000).toString(),
    product: {
      id: products[2].id,
      name: products[2].name,
      price: products[2].price * 2,
      discount: products[1].discounts[2 - 1],
      variant: 2,
      image: ''
    },
    user: {
      id: users[0].id,
      name: users[0].name,
      email: users[0].email
    },
    payment: {
      name: payments[Math.ceil(Math.random() * payments.length - 1)].name,
      link: '',
      status: 'Menunggu Pembayaran',
      createdAt: Date.now() - 45 * 60 * 1000,
      expiredAt: Date.now() + 15 * 60 * 1000
    }
  },
  {
    id: Math.ceil(Math.random() * 8999999999 + 1000000000).toString(),
    product: {
      id: products[3].id,
      name: products[3].name,
      price: products[3].price,
      discount: null,
      variant: null,
      image: ''
    },
    user: {
      id: users[0].id,
      name: users[0].name,
      email: users[0].email
    },
    payment: {
      name: payments[Math.ceil(Math.random() * payments.length - 1)].name,
      link: '',
      status: 'Transaksi Berhasil',
      createdAt: Date.now() - 24 * 60 * 60 * 1000,
      expiredAt: Date.now() - 23 * 60 * 60 * 1000
    }
  },
  {
    id: Math.ceil(Math.random() * 8999999999 + 1000000000).toString(),
    product: {
      id: products[4].id,
      name: products[4].name,
      price: products[4].price,
      discount: null,
      variant: null,
      image: ''
    },
    user: {
      id: users[0].id,
      name: users[0].name,
      email: users[0].email
    },
    payment: {
      name: payments[Math.ceil(Math.random() * payments.length - 1)].name,
      link: '',
      status: 'Transaksi Gagal',
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      expiredAt: Date.now() - 2 * 23 * 60 * 60 * 1000
    }
  }
];
