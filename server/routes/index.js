const express = require('express');
const userRouter = require('./users');
const productRouter = require('./products');
const cartRouter = require('./carts');
const orderRouter = require('./orders');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Shopping Mall API root' });
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/users', userRouter);
router.use('/products', productRouter);
router.use('/carts', cartRouter);
router.use('/orders', orderRouter);

module.exports = router;

