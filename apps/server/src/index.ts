/**
 * Server entry point.
 *
 * Starts the HTTP server and logs the listening address.
 */

import { createApp } from './app.js';
import { env } from './config/index.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`\n🚀 ResumeForge AI Server`);
  console.log(`   Environment: ${env.NODE_ENV}`);
  console.log(`   Listening on: http://localhost:${env.PORT}`);
  console.log(`   Health:       http://localhost:${env.PORT}/api/v1/health`);
  console.log(`   Auth:         http://localhost:${env.PORT}/api/auth/*`);
  console.log(`   API:          http://localhost:${env.PORT}/api/v1/*\n`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${env.PORT} is already in use.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

function shutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down...`);
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Force exit after 5s.');
    process.exit(1);
  }, 5000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));