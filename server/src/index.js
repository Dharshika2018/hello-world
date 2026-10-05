'use strict';
const config = require('./config');
const { createApp } = require('./app');
const { initDatabase, closeDatabase, databaseInfo } = require('./db');
const { ensureSeedData } = require('./seed/seed');

async function start() {
  await initDatabase();
  // Make sure the sysadmin account and demo content exist (safe to run repeatedly)
  try {
    await ensureSeedData();
  } catch (error) {
    console.error(`[seed] Skipped: ${error.message}`);
  }

  const app = createApp();
  const server = app.listen(config.port, '0.0.0.0', () => {
    const info = databaseInfo();
    console.log('');
    console.log(`  ${config.org.name} - scholarship portal API`);
    console.log(`  ──────────────────────────────────────────────`);
    console.log(`  API        : http://localhost:${config.port}/api`);
    console.log(`  Health     : http://localhost:${config.port}/api/health`);
    console.log(`  Database   : ${info.kind} (${info.mode} mode)`);
    console.log(`  Client url : ${config.clientUrl}`);
    console.log(`  Admin login: ${config.seed.adminEmail} / ${config.seed.adminPassword}`);
    console.log('');
  });

  const shutdown = async (signal) => {
    console.log(`\n[server] ${signal} received - shutting down`);
    server.close(async () => {
      await closeDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 5000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((error) => {
  console.error('[server] Failed to start:', error);
  process.exit(1);
});
