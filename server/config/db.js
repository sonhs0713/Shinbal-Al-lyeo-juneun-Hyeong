const mongoose = require('mongoose');

function getMongoUri() {
  // Prefer explicit deployment env, but also support legacy variable names.
  return (
    process.env.MONGO_URI
    || process.env.MONGODB_ATLAS_URL
    || 'mongodb://localhost:27017/shoppingmall'
  );
}

async function connectDb() {
  const mongoUri = getMongoUri();
  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined');
  }

  await mongoose.connect(mongoUri, {
    autoIndex: true,
  });

  console.log('MongoDB connected');
}

module.exports = connectDb;

