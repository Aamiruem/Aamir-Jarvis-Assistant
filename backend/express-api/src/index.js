import cluster from 'node:cluster';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { config } from './config.js';
import { createContainer } from './container.js';

// One container can run several API workers (WEB_CONCURRENCY, "auto" = one per CPU core): the
// primary process only forks and restarts them; every worker serves requests on the same port.
// Several containers (replicas) behind the load balancer scale it further. Shared state lives in
// MongoDB (sessions, OTPs, passkey challenges, rate-limit counters), so any worker can answer.
const workerCount = config.workers === 0 ? os.availableParallelism() : config.workers;

if (cluster.isPrimary && workerCount > 1) {
  runPrimary(workerCount);
} else {
  await runServer();
}

function runPrimary(count) {
  console.log(`Azarvis API: starting ${count} workers on port ${config.port}`);
  let stopping = false;
  const recentCrashes = [];
  for (let i = 0; i < count; i++) cluster.fork();

  // A worker that dies unexpectedly is replaced; a crash loop (5 in a minute) stops the whole
  // container instead, so the orchestrator restarts it and the load balancer routes around it.
  cluster.on('exit', (worker, code, signal) => {
    if (stopping) return;
    const now = Date.now();
    recentCrashes.push(now);
    while (recentCrashes[0] < now - 60_000) recentCrashes.shift();
    console.error(`Worker ${worker.process.pid} exited (${signal || code}).`);
    if (recentCrashes.length >= 5) {
      console.error('Workers keep crashing: stopping so the container is restarted.');
      process.exit(1);
    }
    cluster.fork();
  });

  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, () => {
      stopping = true;
      for (const w of Object.values(cluster.workers)) w.process.kill('SIGTERM'); // each drains itself
      const force = setTimeout(() => process.exit(0), config.drainMs + config.shutdownTimeoutMs + 2000);
      force.unref();
      cluster.on('exit', () => Object.keys(cluster.workers).length === 0 && process.exit(0));
    });
  }
}

/** MongoDB if it's reachable. In development only, fall back to JSON files so the app still runs. */
async function chooseStorage() {
  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000, maxPoolSize: 20 });
    if (!cluster.isWorker || cluster.worker.id === 1) console.log('MongoDB connected');
    return { storage: 'mongo' };
  } catch (err) {
    if (config.env === 'production') throw err;
    // JSON files can't be shared safely by several processes writing at once.
    if (cluster.isWorker) throw new Error(`WEB_CONCURRENCY > 1 needs MongoDB (${err.message}).`);
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

async function runServer() {
  const container = createContainer(await chooseStorage());
  const app = createApp(container);
  const server = app.listen(config.port, () => {
    if (cluster.isWorker && cluster.worker.id !== 1) return;
    console.log(`Azarvis Express API on http://localhost:${config.port}`);
    if (config.notifications.provider === 'console') console.log('OTP codes will be printed in this terminal (OTP_PROVIDER=console).');
  });

  // Keep idle connections open longer than the load balancer does (AWS ALB: 60 s, nginx
  // keepalive_timeout: 60 s). If the API closed them first, the balancer could send a request on
  // a connection that is just closing, and the visitor would get a random 502.
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;

  // Graceful shutdown (Docker, ECS and Kubernetes send SIGTERM before stopping a container):
  // 1. report "draining" on /api/health/ready for DRAIN_MS so the balancer stops sending traffic,
  // 2. stop accepting connections and close idle ones, 3. let requests in progress (streaming
  // chat replies) finish, up to SHUTDOWN_TIMEOUT_MS, 4. disconnect from MongoDB and exit.
  let shuttingDown = false;
  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    app.locals.draining = true;
    console.log(`${signal}: draining for ${config.drainMs} ms, then closing.`);
    setTimeout(() => {
      server.close(async () => {
        if (container.storage === 'mongo') await mongoose.disconnect().catch(() => {});
        process.exit(0);
      });
      server.closeIdleConnections();
      setTimeout(() => {
        console.warn('Shutdown timeout: closing the remaining connections.');
        server.closeAllConnections();
        process.exit(0);
      }, config.shutdownTimeoutMs).unref();
    }, config.drainMs);
  };
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => shutdown(signal));
}
