import app from './app';
import config from './config/config';
import connectDatabase from './utils/connectDatabase';
import { initAgenda } from './jobs/agenda'; // <-- import initAgenda (not agenda.start)

async function startServer() {
  try {
    await connectDatabase(); // your Mongoose connection

    // Start HTTP first so API is responsive even if Agenda has issues
    const server = app.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`);
    });

    // Now initialize Agenda (binds to existing mongoose connection + start)
    await initAgenda().catch((err) => {
      console.error('Agenda failed to start:', err);
      // optional: server.close(); process.exit(1);
    });

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();