import './bootstrap-env.js';
import { app } from './app.js';
import sequelize from './configs/db.config.js';
import http from 'http';
import setupSocket from './configs/socket.config.js';

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Initialize Socket.io
setupSocket(server);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected");

    await sequelize.sync();
    console.log("Models synced");

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed", error);
  }
};

startServer();