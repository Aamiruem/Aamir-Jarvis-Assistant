// Vercel serverless entry: vercel.json routes every request here, and the Express app handles it.
// A warm instance keeps its MongoDB connection and app between requests. The app is imported
// lazily so a missing production setting (config.js throws) answers 503 instead of crashing.
let ready;

async function init() {
  const [{ default: mongoose }, { createApp }, { config }, { createContainer }] = await Promise.all([
    import('mongoose'),
    import('../src/app.js'),
    import('../src/config.js'),
    import('../src/container.js'),
  ]);
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
  return createApp(createContainer({ storage: 'mongo' }));
}

export default async function handler(req, res) {
  ready ??= init().catch((err) => {
    ready = undefined; // try again on the next request (e.g. after the settings are fixed)
    throw err;
  });
  let app;
  try {
    app = await ready;
  } catch (err) {
    console.error('API startup failed:', err.message); // shown in the Vercel logs, not to visitors
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Retry-After', '60');
    res.end(JSON.stringify({ error: 'Azarvis is still being set up. Please try again in a little while.', code: 'NOT_CONFIGURED' }));
    return;
  }
  return app(req, res);
}
