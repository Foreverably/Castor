import { ExtendedClient } from "@/structures/Client";
import { BaseMessageCommand, BaseSlashCommand } from "@/structures/base";
import fs from "fs";
import path from "path";

export class CommandHandler
{
	private readonly client: ExtendedClient;
	private readonly commandsPath: string;

	constructor(client: ExtendedClient)
	{
		this.client = client;
		this.commandsPath = path.join(__dirname, "..", "commands");
	}

	public async loadCommands(): Promise<void>
	{
		const categoryDirs = fs
			.readdirSync(this.commandsPath, { withFileTypes: true })
			.filter(dirent => dirent.isDirectory())
			.map(dirent => dirent.name);

		this.client.logger.debug(`[CommandHandler] Found category directories: ${categoryDirs.join(", ")}.`);

		for (const category of categoryDirs)
		{
			const categoryPath = path.join(this.commandsPath, category);
			const commandFiles = fs
				.readdirSync(categoryPath)
				.filter(file => file.endsWith(".ts") || file.endsWith(".js"));

			this.client.logger.debug(`[CommandHandler] Loading commands from category ${category}: ${commandFiles.join(", ")}.`);

			for (const file of commandFiles)
			{
				const filePath = path.join(categoryPath, file);
				const CommandClass = require(filePath).default;

				if (CommandClass.prototype instanceof BaseSlashCommand)
				{
					const command: BaseSlashCommand = new CommandClass(this.client);
					this.client.interactions.set(command.data.name, command);
					this.client.logger.debug(`[CommandHandler] Loaded command: ${command.data.name} (${command.category}).`);
				}
				else if (CommandClass.prototype instanceof BaseMessageCommand)
				{
					const command: BaseMessageCommand = new CommandClass(this.client);
					this.client.commands.set(command.name, command);
					this.client.logger.debug(`[CommandHandler] Loaded command: ${command.name} (${command.category}).`);
				}
				else
				{
					this.client.logger.warn(`[CommandHandler] Invalid command file: ${file}.`);
				}
			}
		}
	}
}   