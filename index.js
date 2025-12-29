import "dotenv/config";
import { connectDatabase } from "./src/config/database.js";
import { createBot } from "./src/bot/index.js";
import { createServer } from "./src/api/index.js";

const PORT = process.env.PORT || 3000;

// Global error handlers
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  // Tidak exit agar bot tetap jalan
});

process.on("uncaughtExceptionMonitor", (error, origin) => {
  console.error("❌ Uncaught Exception Monitor:", error, "Origin:", origin);
});

async function main() {
  console.log("🚀 Starting Discord Bot with Express API...\n");

  try {
    // Connect to MongoDB
    await connectDatabase();

    // Initialize Discord Bot
    const botClient = await createBot();

    // Initialize Express Server
    const app = createServer(botClient);

    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n🌐 API Server running on http://localhost:${PORT}`);
      console.log("📚 API Documentation:");
      console.log(`   - Health: GET http://localhost:${PORT}/health`);
      console.log(`   - Users: GET http://localhost:${PORT}/api/users`);
      console.log(`   - Guilds: GET http://localhost:${PORT}/api/guilds`);
      console.log(`   - Stats: GET http://localhost:${PORT}/api/stats`);
    });
  } catch (error) {
    console.error("❌ Failed to start application:", error);
    // Retry setelah 10 detik
    console.log("🔄 Retrying in 10 seconds...");
    setTimeout(() => {
      main();
    }, 10000);
  }
}

main();
