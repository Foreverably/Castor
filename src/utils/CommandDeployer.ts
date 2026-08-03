import { REST, Routes } from "discord.js";
import { ExtendedClient } from "../structures/Client";
import { BaseSlashCommand } from "../structures/base/commands/BaseSlashCommand";
import fs from "fs";
import path from "path";

export class CommandDeployer
{
    private readonly rest: REST;
    private readonly commands: any[];
    private readonly commandsPath: string;

    constructor(private readonly client: ExtendedClient)
    {
        this.rest = new REST().setToken(process.env.DISCORD_TOKEN!);
        this.commands = [];
        this.commandsPath = path.join(__dirname, "..", "commands");
    }

    private loadCommands(): void
    {
        this.client.logger.debug(`[CommandDeployer] Loading commands from ${this.commandsPath}.`);

        const categories = fs
            .readdirSync(this.commandsPath, { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => dirent.name);

        this.client.logger.debug(
            `[CommandDeployer] Found category directories: ${categories.join(", ")}.`,
        );

        for (const category of categories)
        {
            const categoryPath = path.join(this.commandsPath, category);
            const commandFiles = fs
                .readdirSync(categoryPath)
                .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

            this.client.logger.debug(
                `[CommandDeployer] Loading commands from category ${category}: ${commandFiles.join(", ")}.`,
            );

            for (const file of commandFiles)
            {
                const filePath = path.join(categoryPath, file);
                const CommandClass = require(filePath).default;

                if (CommandClass.prototype instanceof BaseSlashCommand)
                {
                    const command: BaseSlashCommand = new CommandClass(this.client);
                    this.commands.push(command.data.toJSON());
                    this.client.logger.debug(
                        `[CommandDeployer] Loaded slash command: ${command.data.name} (${category}).`,
                    );
                }
                else
                {
                    this.client.logger.warn(
                        `[CommandDeployer] Invalid command file: ${file} in category ${category}.`,
                    );
                }
            }
        }
    }

    public async deploy(): Promise<void>
    {
        try
        {
            this.loadCommands();

            this.client.logger.info(
                `[CommandDeployer] Started refreshing ${this.commands.length} application (/) commands globally.`,
            );
            await this.rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID!),
                { body: this.commands },
            );

            this.client.logger.info(
                "[CommandDeployer] Successfully reloaded application (/) commands globally.",
            );
        }
        catch (error)
        {
            this.client.logger.error("[CommandDeployer] Error deploying commands.", error);
            throw error;
        }
    }
}
