const express = require('express');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function calculateFinalTotal(items, pricing = {}) {
  const itemsTotal = (items || []).reduce(
    (sum, it) => sum + (Number(it.unit_price) || 0) * (it.quantity || 0),
    0,
  );
  const shippingFee = Number(pricing.shipping_fee) || 0;
  const discountAmount = Number(pricing.discount_amount) || 0;
  return itemsTotal + shippingFee - discountAmount;
}

function generateOrderNumber() {
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const suffix = Math.floor(100000 + Math.random() * 900000);
  return `ORD-${ymd}-${suffix}`;
}

// 주문 생성
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const payload = req.body || {};
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      return res.status(400).json({ message: '주문 상품이 비어 있습니다.' });
    }

    const finalTotal = calculateFinalTotal(payload.items, payload.pricing);
    const orderNumber = payload.order_number || generateOrderNumber();

    const order = await Order.create({
      user: req.user._id,
      items: payload.items,
      order_number: orderNumber,
      customer: payload.customer,
      shipping: payload.shipping,
      pricing: {
        ...(payload.pricing || {}),
        final_total: finalTotal,
      },
      payment: payload.payment,
      status: payload.status || 'paid',
      paid_at: payload.paid_at,
      notes: payload.notes,
    });

    // 주문 후 장바구니 비우기 (프론트에서도 DELETE /api/carts 호출하지만, 여기서도 한 번 더 시도)
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] }).catch(() => {});

    return res.status(201).json(order);
  } catch (err) {
    return next(err);
  }
});

// 내 주문 목록
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const isAdmin = req.user.user_type === 'seller';
    const query = isAdmin ? {} : { user: req.user._id };
    const orders = await Order.find(query).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    return next(err);
  }
});

// 관리자: 주문 상태/메모 수정
router.put('/:orderId', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const update = req.body || {};
    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      update,
      { new: true, runValidators: true },
    );
    if (!order) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }
    return res.json(order);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

