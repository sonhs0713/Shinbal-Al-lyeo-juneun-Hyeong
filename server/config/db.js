const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shoppingmall';

async function connectDb() {
  if (!MONGO_URI) {
    throw new Error('MONGO_URI is not defined');
  }

  await mongoose.connect(MONGO_URI, {
    autoIndex: true,
  });

  console.log('MongoDB connected');
}

module.exports = connectDb;

