const users = require('./user');
const products = require('./products');

const createMessage = (text, sender, timestamp) => {
  return {
    id: Math.random().toString(),
    text,
    sender,
    timestamp
  };
};

exports.chatRooms = [
  {
    id: Math.random().toString(),
    name: products[0].name,
    image: '',
    users: [users[0], users[1]],
    latestMessage: createMessage(
      'Sesi konsultasi akan segera dimulai',
      users[1],
      Date.now() - 2 * 60 * 1000
    ),
    expiredAt: 0
  },
  {
    id: Math.random().toString(),
    name: products[1].name,
    image: '',
    users: [users[0], users[2]],
    latestMessage: createMessage(
      'Halo gan, ada yang bisa dibantu?',
      users[2],
      Date.now() - 15 * 60 * 1000
    ),
    expiredAt: Date.now() + 60 * 60 * 1000
  },
  {
    id: Math.random().toString(),
    name: products[2].name,
    image: '',
    users: [users[0], users[3]],
    latestMessage: createMessage(
      'Oke gan, sama-sama',
      users[3],
      Date.now() - 24 * 60 * 60 * 1000
    ),
    expiredAt: Date.now() - 24 * 60 * 60 * 1000
  },
  {
    id: Math.random().toString(),
    name: products[3].name,
    image: '',
    users: [users[0], users[4]],
    latestMessage: createMessage(
      'Sudah bisa gan, terima kasih',
      users[0],
      Date.now() - 2 * 24 * 60 * 60 * 1000
    ),
    expiredAt: Date.now() - 2 * 24 * 60 * 60 * 1000
  }
];
