const payment = require('../controllers/payment');
const midtrans = require('../controllers/midtrans');

const messages = require('../utils/messages');

const wrap = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const authentication = (req, res, next) => {
  const { key } = req.query;
  const API_KEY = process.env.API_KEY;

  if (!key || key !== API_KEY) {
    res.status(401).send({
      error: 'Invalid API key',
      code: '401',
      message: 'Please ensure your API key is valid'
    });
    return false;
  }

  next();
};

module.exports = (app) => {
  app.get('/', (req, res) => res.send('UPDATE LAGI ZZZZ'));

  app.get(
    '/test',
    wrap(async (req, res) => {
      const chatRoom = {
        name: 'Konsultasi Test',
        image: '',
        users: [{ id: 'abc', name: 'Kodok' }],
        latestMessage: {
          text: 'Sesi konsultasi akan segera dimulai',
          sender: 'System',
          timestamp: Date.now()
        },
        duration: 1,
        expiredAt: 0
      };

      try {
        await messages.create('123', chatRoom);
        res.status(200).end();
      } catch (error) {
        console.log(error);
      }
    })
  );

  // Create midtrans payment url
  app.post('/api/v1/payment', authentication, wrap(payment.create));

  // Handle midtrans webhook
  app.post('/api/v1/notification', authentication, wrap(midtrans.handle));
};
