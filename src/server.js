const app = require('./app');
const { sequelize } = require('./models');

const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    app.listen(PORT, () => {
      process.stdout.write(`Server is running on http://localhost:${PORT}\n`);
    });
  } catch (error) {
    process.stderr.write(`Server startup failed: ${error.message}\n`);
    process.exit(1);
  }
}

startServer();
