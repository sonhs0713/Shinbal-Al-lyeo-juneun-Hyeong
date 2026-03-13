const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

async function getOrCreateCart(userId) {
  const existing = await Cart.findOne({ user: userId });
  if (existing) return existing;
  return Cart.create({ user: userId, items: [] });
}

function toCartResponse(cart) {
  const items = (cart.items || []).map((item) => ({
    _id: item._id,
    product: item.product,
    selected_size: item.selected_size,
    selected_color: item.selected_color,
    quantity: item.quantity,
  }));
  const totalQuantity = items.reduce((sum, it) => sum + (it.quantity || 0), 0);
  return { _id: cart._id, items, totalQuantity };
}

// 장바구니 조회
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart) {
      return res.json({ items: [], totalQuantity: 0 });
    }

    const populatedItems = cart.items.map((item) => ({
      _id: item._id,
      product: item.product,
      selected_size: item.selected_size,
      selected_color: item.selected_color,
      quantity: item.quantity,
    }));

    const totalQuantity = populatedItems.reduce((sum, it) => sum + (it.quantity || 0), 0);
    return res.json({ items: populatedItems, totalQuantity });
  } catch (err) {
    return next(err);
  }
});

// 장바구니 전체 비우기 (주문 완료 후)
router.delete('/', requireAuth, async (req, res, next) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [] },
      { new: true },
    );
    if (!cart) {
      return res.status(204).send();
    }
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

// 아이템 추가
router.post('/items', requireAuth, async (req, res, next) => {
  try {
    const {
      productId,
      quantity,
      selected_size,
      selected_color,
    } = req.body || {};

    if (!productId) {
      return res.status(400).json({ message: 'productId는 필수입니다.' });
    }

    const product = await Product.findOne({ product_id: productId });
    if (!product) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    const qty = Math.max(1, Math.min(99, Number(quantity) || 1));
    const cart = await getOrCreateCart(req.user._id);

    const existing = cart.items.find(
      (item) => item.product.toString() === product._id.toString()
        && item.selected_size === selected_size
        && item.selected_color === selected_color,
    );

    if (existing) {
      existing.quantity = Math.max(1, Math.min(99, existing.quantity + qty));
    } else {
      cart.items.push({
        product: product._id,
        selected_size,
        selected_color,
        quantity: qty,
      });
    }

    await cart.save();
    await cart.populate('items.product');

    const populatedItems = cart.items.map((item) => ({
      _id: item._id,
      product: item.product,
      selected_size: item.selected_size,
      selected_color: item.selected_color,
      quantity: item.quantity,
    }));
    const totalQuantity = populatedItems.reduce((sum, it) => sum + (it.quantity || 0), 0);

    return res.status(201).json({ items: populatedItems, totalQuantity });
  } catch (err) {
    return next(err);
  }
});

// 아이템 수량 변경
router.put('/items/:itemId', requireAuth, async (req, res, next) => {
  try {
    const qty = Math.max(1, Math.min(99, Number(req.body.quantity) || 1));
    const cart = await getOrCreateCart(req.user._id);

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: '장바구니 항목을 찾을 수 없습니다.' });
    }

    item.quantity = qty;
    await cart.save();
    await cart.populate('items.product');

    const populatedItems = cart.items.map((it) => ({
      _id: it._id,
      product: it.product,
      selected_size: it.selected_size,
      selected_color: it.selected_color,
      quantity: it.quantity,
    }));
    const totalQuantity = populatedItems.reduce((sum, it) => sum + (it.quantity || 0), 0);

    return res.json({ items: populatedItems, totalQuantity });
  } catch (err) {
    return next(err);
  }
});

// 아이템 삭제
router.delete('/items/:itemId', requireAuth, async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: '장바구니 항목을 찾을 수 없습니다.' });
    }
    item.deleteOne();
    await cart.save();
    await cart.populate('items.product');

    const populatedItems = cart.items.map((it) => ({
      _id: it._id,
      product: it.product,
      selected_size: it.selected_size,
      selected_color: it.selected_color,
      quantity: it.quantity,
    }));
    const totalQuantity = populatedItems.reduce((sum, it) => sum + (it.quantity || 0), 0);

    return res.json({ items: populatedItems, totalQuantity });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

