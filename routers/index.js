// const payment = require('../controllers/payment');

// const wrap = (fn) => (req, res, next) => {
//   Promise.resolve(fn(req, res, next)).catch(next);
// };

// const authentication = (req, res, next) => {
//   const { key } = req.query;
//   const API_KEY = process.env.API_KEY;

//   if (!key || key !== API_KEY) {
//     res.status(401).send({ error: 'Unauthorized', message: 'Invalid API key' });
//     return false;
//   }

//   next();
// };

module.exports = (app) => {
  app.get('/', (req, res) => res.send('Halo gan'));

  // app.post('/api/v1/payment', authentication, wrap(payment.create));

  // app.post('/api/v1/notification', authentication, wrap(payment.notification));
};
