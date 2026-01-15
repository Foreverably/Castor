import path from "path";
import { REST, Routes } from "discord.js";
import { loadCommandsFromDir } from "./loadCommands.js";

/**
 * Registers slash commands with Discord.
 * Expects environment variables:
 * - app_token (production bot token)
 * - dev_app_token (development bot token)
 * - DEV_GUILD_ID (optional, for faster dev deployment)
 *
 * Options: { client, isProduction }
 */
export default async function registerInteractions({ client, isProduction })
{
	const commandsPath = path.join(process.cwd(), "bot", "commands");
	const { commandsJson } = await loadCommandsFromDir(commandsPath);

	if (!commandsJson || commandsJson.length === 0)
	{
		console.log("No commands found to register.");
		return;
	}

	const token = isProduction ? process.env.app_token : process.env.dev_app_token;
	if (!token)
	{
		console.warn("No token available for registering commands. Skipping.");
		return;
	}

	const rest = new REST({ version: "10" }).setToken(token);

	try
	{
		const applicationId = client.user?.id ?? process.env.CLIENT_ID;

		async function cleanupOldCommands(scope, guildId)
		{
			try
			{
				let existing = [];
				if (scope === "global")
				{
					existing = await rest.get(Routes.applicationCommands(applicationId));
				}
				else if (scope === "guild")
				{
					existing = await rest.get(Routes.applicationGuildCommands(applicationId, guildId));
				}

				const newNames = new Set(commandsJson.map(c => c.name));
				for (const cmd of existing)
				{
					if (!newNames.has(cmd.name))
					{
						try
						{
							if (scope === "global")
							{
								await rest.delete(Routes.applicationCommand(applicationId, cmd.id));
								console.log(`Deleted old global command ${cmd.name}`);
							}
							else
							{
								await rest.delete(Routes.applicationGuildCommand(applicationId, guildId, cmd.id));
								console.log(`Deleted old guild command ${cmd.name} from guild ${guildId}`);
							}
						}
						catch (delErr)
						{
							console.warn(`Failed to delete old command ${cmd.name}:`, delErr?.message ?? delErr);
						}
					}
				}
			}
			catch (err)
			{
				console.warn("Failed to fetch existing commands for cleanup:", err?.message ?? err);
			}
		}

		if (isProduction)
		{
			console.log(`Registering ${commandsJson.length} global commands...`);
			await cleanupOldCommands("global");
			await rest.put(Routes.applicationCommands(applicationId), { body: commandsJson });
			console.log("Global commands registered.");
		}
		else
		{
			const guildId = process.env.DEV_GUILD_ID;

			await cleanupOldCommands("global");

			if (!guildId)
			{
				console.warn("DEV_GUILD_ID not set; falling back to global registration for development. This may be slow.");
				await rest.put(Routes.applicationCommands(applicationId), { body: commandsJson });
				console.log("Commands registered globally (dev fallback).");
			}
			else
			{
				console.log(`Registering ${commandsJson.length} commands to guild ${guildId}...`);
				await cleanupOldCommands("guild", guildId);
				await rest.put(Routes.applicationGuildCommands(applicationId, guildId), { body: commandsJson });
				console.log("Guild commands registered.");
			}
		}
	}
	catch (err)
	{
		console.error("Failed to register commands:", err);
	}
}
