import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongoUrl = process.env.mongoDb_Url;

if (!mongoUrl) {
  throw new Error("MongoDb_Url environment variable is not defined!");
}

let isConnected = false;

async function connectToMongoDb() {
  if (isConnected) return;

  await mongoose.connect(mongoUrl, {
    maxPoolSize: 1, // keep small for Vercel
    serverSelectionTimeoutMS: 5000
  });

  isConnected = true;
  console.log("MongoDB Connected");
}

export default connectToMongoDb;