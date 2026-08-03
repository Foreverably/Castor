import {
    BaseSlashCommand,
    Builder,
    Interaction,
} from "@/structures/base/commands/BaseSlashCommand";
import {
    Category,
    Permissions,
} from "@/structures/base/commands/CommandDecorators";
import { ExtendedClient } from "@/structures/Client";
import { CommandCategory } from "@/types/CommandCategories";
import { JokesDatabase } from "@/utils/JokesDatabase";
import { MessageFlags } from "discord.js";
import fetch from "node-fetch";

@Category(CommandCategory.ADMIN)
@Permissions("ManageMessages")
export default class MigrateJokesCommand extends BaseSlashCommand
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            name: "migratejokes",
            description: "Migrate dad jokes from an attached JSON file to the database.",
            cooldown: 10,
            usage: "/migratejokes <file>",
            devOnly: true,
            construct: () =>
                new Builder<"SlashCommandBuilder">()
                    .setName("migratejokes")
                    .setDescription(
                        "Migrate dad jokes from an attached JSON file to the database.",
                    )
                    .addAttachmentOption((option) =>
                        option
                            .setName("file")
                            .setDescription("The JSON file containing the jokes.")
                            .setRequired(true),
                    ),
        });
    }

    async execute(interaction: Interaction<"ChatInput">): Promise<void>
    {
        const attachment = interaction.options.getAttachment("file");

        if (!attachment || !attachment.name?.toLowerCase().endsWith(".json"))
        {
            await interaction.reply({
                content:
                    "Please attach a valid `.json` file containing the jokes.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.deferReply();

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
                await interaction.editReply(
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
                await interaction.editReply(
                    "❌ Error: No valid jokes found in the file. Each joke must have a setup and a punchline.",
                );
                return;
            }

            await interaction.editReply(
                `Found ${jokesToMigrate.length} jokes. Inserting into database...`,
            );

            const inserted = await JokesDatabase.addJokesBatch(jokesToMigrate);

            await interaction.editReply(
                `✅ Successfully migrated **${inserted}** jokes to the MariaDB database!`,
            );
        }
        catch (error: any)
        {
            this.client.logger.error("Error migrating jokes:", error);
            await interaction.editReply(`❌ Error during migration: ${error.message || error}`);
        }
    }
}
