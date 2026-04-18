import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`well Done sucssesfully -_- : ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection failed(try again):", error);
    process.exit(1);
  }
};

export default connectDB;