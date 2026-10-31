import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { config } from './config.js';
import { createContainer } from './container.js';

/** MongoDB if it's reachable. In development only, fall back to JSON files so the app still runs. */
async function chooseStorage() {
  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log('MongoDB connected');
    return { storage: 'mongo' };
  } catch (err) {
    if (config.env === 'production') throw err;
    await mongoose.disconnect().catch(() => {});
    const dataDir = fileURLToPath(new URL('../data/', import.meta.url));
    console.warn(
      `\n⚠  MongoDB is not reachable at ${config.mongoUri} (${err.message}).\n` +
        `   Development fallback: saving accounts and chats as JSON files in ${dataDir}\n` +
        '   For MongoDB, install it, run `docker compose up mongo`, or set MONGO_URI (e.g. a free MongoDB Atlas cluster).\n',
    );
    return { storage: 'file', dataDir };
  }
}

const container = createContainer(await chooseStorage());
const server = createApp(container).listen(config.port, () => {
  console.log(`Jarvis Express API on http://localhost:${config.port}`);
  if (config.notifications.provider === 'console') console.log('OTP codes will be printed in this terminal (OTP_PROVIDER=console).');
});

// Graceful shutdown (Docker / ECS send SIGTERM before stopping a container).
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(async () => {
      if (container.storage === 'mongo') await mongoose.disconnect();
      process.exit(0);
    });
  });
}
