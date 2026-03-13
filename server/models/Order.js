const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    product_id: String,
    sku: String,
    brand: String,
    category: String,
    image: String,
    selected_size: Number,
    selected_color: String,
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unit_price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],
    order_number: {
      type: String,
      unique: true,
    },
    customer: {
      name: String,
      phone: String,
    },
    shipping: {
      recipient_name: String,
      phone: String,
      address1: String,
      address2: String,
      zipcode: String,
      delivery_memo: String,
    },
    pricing: {
      shipping_fee: {
        type: Number,
        default: 0,
      },
      discount_amount: {
        type: Number,
        default: 0,
      },
      final_total: {
        type: Number,
        default: 0,
      },
    },
    payment: {
      method: String,
      status: String,
      transaction_id: String,
      imp_uid: String,
      merchant_uid: String,
      approved_at: String,
    },
    status: {
      type: String,
      default: 'paid',
    },
    paid_at: String,
    notes: String,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Order', orderSchema);

