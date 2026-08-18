
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);
    
    // Temporarily put your full connection string here for testing
    const conn = await mongoose.connect(process.env.MONGO_URI );
    
    console.log(`Database Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log("MongoDB Connection Error:", error.message);
  }
};

module.exports = connectDB;