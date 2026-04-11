import path from "path";
import { REST, Routes } from "discord.js";
import { loadCommandsFromDir } from "./loadCommands.js";

export default async function registerInteractions({ client, isProduction })
{
	const commandsPath = path.join(process.cwd(), "src", "bot", "commands");
	const { commandsJson } = await loadCommandsFromDir(commandsPath);
	const token = isProduction ? process.env.APP_TOKEN : process.env.DEV_APP_TOKEN;

	if (commandsJson.length === 0)
	{
		console.log("No commands found to register.");
		return;
	}

	const rest = new REST({ version: "10" }).setToken(token);
	const applicationId = client.user?.id ?? process.env.CLIENT_ID;

	try
	{
		if (isProduction)
		{
			console.log(`Refreshing ${commandsJson.length} global application (/) commands.`);
			await rest.put(
				Routes.applicationCommands(applicationId),
				{ body: commandsJson }
			);
		}
		else
		{
			const guildId = process.env.DEV_GUILD_ID;

			if (!guildId)
			{
				console.warn("DEV_GUILD_ID not set; refreshing global commands instead.");
				await rest.put(
					Routes.applicationCommands(applicationId),
					{ body: commandsJson }
				);
				return;
			}

			console.log(`Refreshing ${commandsJson.length} guild (/) commands for guild: ${guildId}`);
			await rest.put(
				Routes.applicationGuildCommands(applicationId, guildId),
				{ body: commandsJson }
			);
		}

		console.log("Successfully reloaded application (/) commands.");
	}
	catch (error)
	{
		console.error("Error refreshing commands:", error);
	}
}