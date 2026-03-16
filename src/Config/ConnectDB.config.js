const mongoose = require("mongoose");

const connectDatabase = async () => {
    try {
        const url = process.env.MONGO_URL;
        const conn = await mongoose.connect(url);
        console.log(`Database connected successfully: ${conn.connection.host}`);
    } catch (error) {
       
        console.error("Database connection failed!");
        console.error(error.message);
        process.exit(1); 
    }
};

module.exports = connectDatabase;