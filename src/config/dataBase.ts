import mongoose from "mongoose";
import config from "./config.js";


export class Database {
  
  private static instance: Database;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  // Connect to MongoDB
  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('MongoDB is already connected');
      return;
    }

    try {
      // Set mongoose options
      mongoose.set('strictQuery', true);

      // Connect to MongoDB
      await mongoose.connect(config.mongoURI as string);
      
      this.isConnected = true;
      console.log('✅ MongoDB connected successfully');
      
      // Log connection information in development mode
      if (config.environment === 'development') {
        console.log(`MongoDB connection string: ${this.maskConnectionString(config.mongoURI as string)}`);
      }
    } catch (error) {
      this.isConnected = false;
      console.error('MongoDB connection error', error)
      throw error;
    }
  }

  // Disconnect from MongoDB
  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('MongoDB disconnected');
    } catch (error) {
      console.log('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  // Check connection status
  public isConnectedToDatabase(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  // Mask connection string for logging
  private maskConnectionString(connectionString: string): string {
    try {
      const url = new URL(connectionString);
      
      // Mask username and password if present
      if (url.username) {
        url.username = '****';
      }
      
      if (url.password) {
        url.password = '****';
      }
      
      return url.toString();
    } catch (error) {
      // If parsing fails, return a generic masked string
      return 'mongodb://*****:*****@*****/*****';
    }
  }
}

// Export singleton instance
export const database = Database.getInstance();

// Setup event handlers for MongoDB connection
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// Handle application termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});