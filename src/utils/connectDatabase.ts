import { database } from "../config/dataBase";

const connectDatabase = async () => {
  try {
    await database.connect();
    return true;

  } catch (error) {
    console.error('Failed to connect to database:', error);
    return false;
  }
}

export default connectDatabase;
