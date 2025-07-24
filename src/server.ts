import app from "./app";
import config from "./config/config.js";
import connectDatabase from "./utils/connectDatabase";

async function startServer() {
  try {
    // Connect to MongoDB
    await connectDatabase();

    app.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();