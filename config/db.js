const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Database connected');
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1); // Exit process on failure
  }
};

module.exports = connectDB;
