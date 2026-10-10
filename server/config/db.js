import mongoose from "mongoose";

const connectDB = async () => {
  mongoose.connection.on("connected", () => console.log("MongoDB connected"));
  mongoose.connection.on("error", (err) => console.error("MongoDB error:", err.message));
  try {
    await mongoose.connect(process.env.MONGODB_URI);
  } catch (error) {
    // Previously the error was only logged and the server kept running
    // without a database, so every request hung or failed later.
    console.error("Could not connect to MongoDB:", error.message);
    process.exit(1);
  }
};

export default connectDB;
