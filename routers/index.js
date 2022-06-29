const payment = require('../controllers/payment');
const midtrans = require('../controllers/midtrans');
const notification = require('../controllers/notification');
const user = require('../controllers/user');
const messages = require('../controllers/messages');

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
  app.get('/', (req, res) => res.send('update lagi gan/sis zzzz'));

  // Create midtrans payment url
  app.post('/api/v1/payment', authentication, wrap(payment.create));

  // Cancel midtrans transaction
  app.post('/api/v1/payment/cancel/:id', authentication, wrap(payment.cancel));

  // Handle midtrans webhook
  app.post('/api/v1/notification', authentication, wrap(midtrans.handle));

  // Send push message
  app.post(
    '/api/v1/notification/send/:receiver',
    authentication,
    wrap(notification.send)
  );

  // Save user data
  app.post('/api/v1/user/:id', authentication, wrap(user.save));

  // Accept pending message
  app.post(
    '/api/v1/messages/accept/:id',
    authentication,
    wrap(messages.acceptPending)
  );
};
