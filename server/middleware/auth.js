const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [, token] = authHeader.split(' ');

    if (!token) {
      return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      return res.status(401).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: '인증이 필요합니다.' });
  }
  if (req.user.user_type !== 'seller') {
    return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
  }
  return next();
}

function signUserToken(user) {
  const payload = {
    userId: user._id.toString(),
    user_id: user.user_id,
    email: user.email,
    user_type: user.user_type,
  };
  const options = {
    expiresIn: '7d',
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

module.exports = {
  requireAuth,
  requireAdmin,
  signUserToken,
};

