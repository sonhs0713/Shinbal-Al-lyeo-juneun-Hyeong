const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // 로그인/식별용
    user_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    // 비밀번호는 해시 형태로 저장
    password_hash: {
      type: String,
      required: true,
    },

    // 회원 유형 (SignupPage에서 buyer/seller 전송)
    user_type: {
      type: String,
      enum: ['buyer', 'seller'],
      default: 'buyer',
    },

    // 프로필/주소 정보 (OrderPage의 getAccountProfile 에서 여러 이름으로 접근)
    name: { type: String, trim: true },
    username: { type: String, trim: true },
    user_name: { type: String, trim: true },
    nickname: { type: String, trim: true },

    address: { type: String, trim: true },

    zipcode: { type: String, trim: true },
    postal_code: { type: String, trim: true },

    phone: { type: String, trim: true },
    phone_number: { type: String, trim: true },
    tel: { type: String, trim: true },
    mobile: { type: String, trim: true },
  },
  {
    // createdAt, updatedAt 자동 관리
    timestamps: true,
  },
);

module.exports = mongoose.model('User', userSchema);

