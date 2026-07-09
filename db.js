const mongoose = require('mongoose');

const connectDB = async (uri) => {
    try {
        const conn = await mongoose.connect(uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/football_ai');
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        // Don't exit - app can run without DB for demo
        return null;
    }
};

module.exports = connectDB;
