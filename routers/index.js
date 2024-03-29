const payment = require('../controllers/payment');
const midtrans = require('../controllers/midtrans');

const { check } = require('../utils/orders');

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
  app.get('/', (req, res) => res.send('V1 Fix'));

  app.get(
    '/api/v1/check',
    authentication,
    wrap(async (req, res) => {
      const result = await check();

      if (result.error) return res.status(500).send(result);
      res.status(200).send(result);
    })
  );

  // Create midtrans payment url
  app.post('/api/v1/payment', authentication, wrap(payment.create));

  // Handle midtrans webhook
  app.post('/api/v1/notification', authentication, wrap(midtrans.handle));
};
