const express = require('express');
const Product = require('../models/Product');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 공개: 메인/브라우즈/상세에서 사용
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 200);
    const page = Math.max(Number(req.query.page) || 1, 1);

    const query = { is_active: true };
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(query),
    ]);

    res.json({
      products,
      page,
      limit,
      total,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:productId', async (req, res, next) => {
  try {
    const product = await Product.findOne({ product_id: req.params.productId });
    if (!product) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }
    return res.json(product);
  } catch (err) {
    return next(err);
  }
});

// 관리자: 상품 생성
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const {
      product_id,
      sku,
      brand,
      category,
      gender,
      price,
      description,
      image,
      color,
      colors,
      sizes,
      is_active,
    } = req.body || {};

    if (!product_id || price == null) {
      return res.status(400).json({ message: 'product_id와 price는 필수입니다.' });
    }

    const exists = await Product.findOne({ product_id });
    if (exists) {
      return res.status(409).json({ message: '이미 존재하는 product_id 입니다.' });
    }

    const product = await Product.create({
      product_id,
      sku,
      brand,
      category,
      gender,
      price,
      description,
      image,
      color,
      colors,
      sizes,
      is_active,
    });

    return res.status(201).json(product);
  } catch (err) {
    return next(err);
  }
});

// 관리자: 상품 수정
router.put('/:productId', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const update = { ...req.body };
    const product = await Product.findOneAndUpdate(
      { product_id: req.params.productId },
      update,
      { new: true, runValidators: true },
    );

    if (!product) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    return res.json(product);
  } catch (err) {
    return next(err);
  }
});

// 관리자: 상품 삭제
router.delete('/:productId', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({ product_id: req.params.productId });
    if (!product) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

