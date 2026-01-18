import * as Discord from "discord.js";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import dotenv from "dotenv";
import mongoose from "mongoose";

import { isProduction } from "./config.js";
import registerInteractions from "./src/bot/workers/interactions/registerInteractions.js";
import handleInteractions from "./src/bot/workers/interactions/handleInteractions.js";

dotenv.config();

await mongoose
	.connect(process.env.MONGO_URI)
	.then(() =>
	{
		console.info("Connected to MongoDB");
	})
	.catch((err) =>
	{
		console.error("Error connecting to MongoDB", {
			error: err.message || null,
			stack: err.stack || null
		});

		process.exit(1);
	});

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildMessageReactions
	],
	partials: [ Partials.Message, Partials.Channel, Partials.GuildMember, Partials.Reaction ]
});


client.buttons = new Discord.Collection();
client.commands = new Discord.Collection();
client.games = new Discord.Collection();

client.once("clientReady", async () =>
{
	console.log(`Logged in as ${client.user.tag} (id: ${client.user.id})`);

	try
	{
		await registerInteractions({ client, isProduction });
		await handleInteractions({ client });
	}
	catch (err)
	{
		console.error("Failed to setup interactions:", err);
	}
});

const token = isProduction ? process.env.app_token : process.env.dev_app_token;
if (!token)
{
	console.error("No bot token found in environment. Set app_token or dev_app_token.");
	process.exit(1);
}

client.login(token).catch(err =>
{
	console.error("Login failed:", err);
	process.exit(1);
});

export { client };