const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { requireAuth, requireAdmin, signUserToken } = require('../middleware/auth');

const router = express.Router();

// 헬퍼: 응답에서 민감한 필드 제거
function toPublicUser(userDoc) {
  const user = userDoc.toObject({ versionKey: false });
  delete user.password_hash;
  return user;
}

// 로그인
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'email과 password는 필수입니다.' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const ok = await bcrypt.compare(String(password), user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const token = signUserToken(user);
    return res.json({ token, user: toPublicUser(user) });
  } catch (err) {
    return next(err);
  }
});

// 내 정보
router.get('/me', requireAuth, (req, res) => {
  res.json(toPublicUser(req.user));
});

// CREATE - 회원가입 (클라이언트에서 사용하는 엔드포인트와 맞추기 위해 /signup 별도 제공)
router.post('/signup', async (req, res, next) => {
  try {
    const {
      user_id, email, password, user_type = 'buyer', address,
    } = req.body || {};

    if (!user_id || !email || !password) {
      return res.status(400).json({ message: 'user_id, email, password는 필수입니다.' });
    }

    const exists = await User.findOne({ $or: [{ user_id }, { email }] });
    if (exists) {
      return res.status(409).json({ message: '이미 사용 중인 아이디 또는 이메일입니다.' });
    }

    const password_hash = await bcrypt.hash(String(password), 10);

    const user = await User.create({
      user_id,
      email,
      password_hash,
      user_type,
      address,
    });

    return res.status(201).json(toPublicUser(user));
  } catch (err) {
    return next(err);
  }
});

// CREATE - 일반 생성 (관리자용 등)
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const {
      user_id,
      email,
      password,
      user_type,
      name,
      username,
      user_name,
      nickname,
      address,
      zipcode,
      postal_code,
      phone,
      phone_number,
      tel,
      mobile,
    } = req.body || {};

    if (!user_id || !email || !password) {
      return res.status(400).json({ message: 'user_id, email, password는 필수입니다.' });
    }

    const exists = await User.findOne({ $or: [{ user_id }, { email }] });
    if (exists) {
      return res.status(409).json({ message: '이미 사용 중인 아이디 또는 이메일입니다.' });
    }

    const password_hash = await bcrypt.hash(String(password), 10);

    const user = await User.create({
      user_id,
      email,
      password_hash,
      user_type,
      name,
      username,
      user_name,
      nickname,
      address,
      zipcode,
      postal_code,
      phone,
      phone_number,
      tel,
      mobile,
    });

    return res.status(201).json(toPublicUser(user));
  } catch (err) {
    return next(err);
  }
});

// READ - 전체 목록
router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.json(users.map(toPublicUser));
  } catch (err) {
    return next(err);
  }
});

// READ - 단일 조회
router.get('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    return res.json(toPublicUser(user));
  } catch (err) {
    return next(err);
  }
});

// UPDATE - 일부 수정
router.patch('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const update = { ...req.body };

    // 비밀번호 변경이 요청된 경우 해시 처리
    if (Object.prototype.hasOwnProperty.call(update, 'password')) {
      if (!update.password) {
        return res.status(400).json({ message: 'password는 비워 둘 수 없습니다.' });
      }
      update.password_hash = await bcrypt.hash(String(update.password), 10);
      delete update.password;
    }

    // 이메일/아이디 중복 체크
    if (update.user_id || update.email) {
      const conflict = await User.findOne({
        _id: { $ne: req.params.id },
        $or: [
          update.user_id ? { user_id: update.user_id } : null,
          update.email ? { email: update.email } : null,
        ].filter(Boolean),
      });
      if (conflict) {
        return res.status(409).json({ message: '이미 사용 중인 아이디 또는 이메일입니다.' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true },
    );

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    return res.json(toPublicUser(user));
  } catch (err) {
    return next(err);
  }
});

// DELETE - 삭제
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

