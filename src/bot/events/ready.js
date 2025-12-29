export default {
  name: "ready",
  once: true,
  execute(client) {
    console.log(`🤖 Bot logged in as ${client.user.tag}`);
    console.log(`📊 Serving ${client.guilds.cache.size} servers`);

    // Set bot status
    client.user.setPresence({
      activities: [
        {
          name: `${client.guilds.cache.size} servers | !help`,
          type: 3, // Watching
        },
      ],
      status: "online",
    });
  },
};
