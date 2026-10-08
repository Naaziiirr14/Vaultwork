import mongoose from "mongoose";
import dns from "dns";

// Network DNS SRV lookup-ஐ block pannina, Google DNS use pannி fix pannுறோம்
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 4000;

const connectWithRetry = async (attempt = 1) => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000, // 15 sec wait pannitu error throw pannum
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection attempt ${attempt} failed: ${error.message}`);

    if (attempt >= MAX_RETRIES) {
      console.error("MongoDB connection failed after multiple attempts. Check your network or MONGO_URI.");
      process.exit(1);
    }

    console.log(`Retrying in ${RETRY_DELAY_MS / 1000} seconds... (${attempt}/${MAX_RETRIES})`);
    setTimeout(() => connectWithRetry(attempt + 1), RETRY_DELAY_MS);
  }
};

// Connection naduvula edhavadhu drop aana (network switch, sleep mode) reconnect pannum
mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected. Attempting to reconnect...");
  connectWithRetry();
});

const connectDB = () => connectWithRetry();

export default connectDB;