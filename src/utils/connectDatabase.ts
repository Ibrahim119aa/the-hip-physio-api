// import { database } from "../config/dataBase";

// const connectDatabase = async () => {
//   try {
//     await database.connect();
//     return true;

//   } catch (error) {
//     console.error('Failed to connect to database:', error);
//     return false;
//   }
// }

// export default connectDatabase;

import mongoose from "mongoose"
import config from "../config/config.js";

export const connectDatabase = async () => {
  try {
    const { connection } = await mongoose.connect(config.mongoURI as string);
    console.log(`MongoDB connected with ${connection.host}`);
    
    return connection.host;
    
  } catch (error) {
    console.log('DB connection :',error);
    process.exit(1);
  }
}

export default connectDatabase;