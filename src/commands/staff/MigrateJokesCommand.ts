import { BaseMessageCommand } from "@/structures/base/commands/BaseMessageCommand";
import { ExtendedClient } from "@/structures/Client";
import { CommandCategory } from "@/types/CommandCategories";
import { JokesDatabase } from "@/utils/JokesDatabase";
import { Message } from "discord.js";
import fetch from "node-fetch";

export default class MigrateJokesCommand extends BaseMessageCommand
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            name: "migratejokes",
            description: "Migrate dad jokes from an attached JSON file to the database.",
            category: CommandCategory.ADMIN,
            cooldown: 10,
            usage: "migratejokes (with attached JSON file or replying to one)",
            permissions: ["ManageMessages"],
            devOnly: true,
        });
    }

    async execute(message: Message, args: string[]): Promise<void>
    {
        let attachment = message.attachments.first();

        if (!attachment && message.reference?.messageId)
        {
            try
            {
                const repliedMessage = await message.channel.messages.fetch(
                    message.reference.messageId,
                );
                attachment = repliedMessage.attachments.first();
            }
            catch (error)
            {
                this.client.logger.error("Failed to fetch replied message:", error);
            }
        }

        if (!attachment || !attachment.name?.toLowerCase().endsWith(".json"))
        {
            await message.reply(
                "Please attach a valid `.json` file containing the jokes, or reply to a message that has one attached.",
            );
            return;
        }

        const statusMessage = await message.reply("Downloading attached jokes file...");

        try
        {
            const response = await fetch(attachment.url);
            if (!response.ok)
            {
                throw new Error(`Failed to fetch attachment: ${response.statusText}`);
            }

            const data = await response.json();
            if (!Array.isArray(data))
            {
                await statusMessage.edit(
                    "❌ Error: The JSON root must be an array of joke objects.",
                );
                return;
            }

            const jokesToMigrate: { setup: string; punchline: string }[] = [];
            for (const item of data)
            {
                const setup = (item.setup || item.question || "").toString().trim();
                const punchline = (item.punchline || item.answer || "").toString().trim();

                if (setup && punchline)
                {
                    jokesToMigrate.push({ setup, punchline });
                }
            }

            if (jokesToMigrate.length === 0)
            {
                await statusMessage.edit(
                    "❌ Error: No valid jokes found in the file. Each joke must have a setup and a punchline.",
                );
                return;
            }

            await statusMessage.edit(
                `Found ${jokesToMigrate.length} jokes. Inserting into database...`,
            );

            const inserted = await JokesDatabase.addJokesBatch(jokesToMigrate);

            await statusMessage.edit(
                `✅ Successfully migrated **${inserted}** jokes to the MariaDB database!`,
            );
        }
        catch (error: any)
        {
            this.client.logger.error("Error migrating jokes:", error);
            await statusMessage.edit(`❌ Error during migration: ${error.message || error}`);
        }
    }
}
