const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexus_journal';

  try {
    await mongoose.connect(uri, {
      autoIndex: true,
    });
    // eslint-disable-next-line no-console
    console.log('MongoDB connected');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('MongoDB connection error', err);
    process.exit(1);
  }
}

module.exports = { connectDB };

