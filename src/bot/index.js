import {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
} from "discord.js";
import { readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const createBot = async () => {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildPresences,
    ],
  });

  client.commands = new Collection();
  client.slashCommands = new Collection();

  // Global error handlers untuk mencegah bot crash
  process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  });

  process.on("uncaughtException", (error) => {
    console.error("❌ Uncaught Exception:", error);
  });

  process.on("uncaughtExceptionMonitor", (error, origin) => {
    console.error("❌ Uncaught Exception Monitor:", error, "Origin:", origin);
  });

  // Discord.js error handler
  client.on("error", (error) => {
    console.error("❌ Discord Client Error:", error);
  });

  client.on("warn", (warning) => {
    console.warn("⚠️ Discord Client Warning:", warning);
  });

  // Load prefix commands
  const commandsPath = join(__dirname, "commands");
  const commandFiles = readdirSync(commandsPath).filter((file) =>
    file.endsWith(".js")
  );

  for (const file of commandFiles) {
    try {
      const filePath = join(commandsPath, file);
      const command = await import(filePath);
      client.commands.set(command.default.name, command.default);
      console.log(`📝 Loaded command: ${command.default.name}`);
    } catch (error) {
      console.error(`❌ Error loading command ${file}:`, error);
    }
  }

  // Load slash commands
  const slashCommandsPath = join(__dirname, "slashCommands");
  if (existsSync(slashCommandsPath)) {
    const slashCommandFiles = readdirSync(slashCommandsPath).filter((file) =>
      file.endsWith(".js")
    );

    const slashCommandsData = [];

    for (const file of slashCommandFiles) {
      try {
        const filePath = join(slashCommandsPath, file);
        const command = await import(filePath);

        // Skip jika tidak ada data
        if (!command.default || !command.default.data) {
          console.log(`⚠️ Skipped invalid slash command: ${file}`);
          continue;
        }

        client.slashCommands.set(command.default.data.name, command.default);
        slashCommandsData.push(command.default.data.toJSON());
        console.log(`⚡ Loaded slash command: ${command.default.data.name}`);
      } catch (error) {
        console.error(`❌ Error loading slash command ${file}:`, error);
      }
    }

    // Register slash commands
    const rest = new REST({ version: "10" }).setToken(
      process.env.DISCORD_TOKEN
    );

    try {
      console.log("🔄 Registering slash commands...");
      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
        body: slashCommandsData,
      });
      console.log("✅ Slash commands registered!");
    } catch (error) {
      console.error("❌ Error registering slash commands:", error);
    }
  }

  // Load events
  const eventsPath = join(__dirname, "events");
  const eventFiles = readdirSync(eventsPath).filter((file) =>
    file.endsWith(".js")
  );

  for (const file of eventFiles) {
    try {
      const filePath = join(eventsPath, file);
      const event = await import(filePath);

      if (event.default.once) {
        client.once(event.default.name, async (...args) => {
          try {
            await event.default.execute(...args, client);
          } catch (error) {
            console.error(`❌ Error in event ${event.default.name}:`, error);
          }
        });
      } else {
        client.on(event.default.name, async (...args) => {
          try {
            await event.default.execute(...args, client);
          } catch (error) {
            console.error(`❌ Error in event ${event.default.name}:`, error);
          }
        });
      }
      console.log(`🎫 Loaded event: ${event.default.name}`);
    } catch (error) {
      console.error(`❌ Error loading event ${file}:`, error);
    }
  }

  // Login with retry
  try {
    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.error("❌ Error logging in:", error);
    console.log("🔄 Retrying login in 5 seconds...");
    setTimeout(async () => {
      try {
        await client.login(process.env.DISCORD_TOKEN);
      } catch (retryError) {
        console.error("❌ Retry login failed:", retryError);
      }
    }, 5000);
  }

  return client;
};

export default createBot;
