const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(
      process.env.MONGO_URI,
      {
        serverSelectionTimeoutMS: 10000
      }
    );

    console.log(
      `MongoDB Connected Successfully: ${connection.connection.host}`
    );

    console.log(
      `Database Name: ${connection.connection.name}`
    );

  } catch (error) {
    console.error("MongoDB Connection Failed!");
    console.error(error.message);

    throw error;
  }
};

module.exports = connectDB;