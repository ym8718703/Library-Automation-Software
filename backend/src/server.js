const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const { testConnection } = require('./config/database');

const PORT = parseInt(process.env.PORT || '5000', 10);

async function startServer() {
  console.log('='.repeat(70));
  console.log('Starting Library Management System Backend Server...');
  console.log('='.repeat(70));

  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('CRITICAL: Cannot connect to MySQL database. Please verify credentials in .env.');
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`[HTTP Server] Listening on http://localhost:${PORT}`);
    console.log(`[HTTP Server] API Base: http://localhost:${PORT}/api`);
    console.log(`[HTTP Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('='.repeat(70));
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('\nShutting down server gracefully...');
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer();
