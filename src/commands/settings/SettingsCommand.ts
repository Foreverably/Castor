import {
    BaseSlashCommand,
    Builder,
    Interaction,
} from "@/structures/base/commands/BaseSlashCommand";
import { Category } from "@/structures/base/commands/CommandDecorators";
import { ExtendedClient } from "@/structures/Client";
import { CommandCategory } from "@/types/CommandCategories";
import { MessageFlags } from "discord.js";
import { buildOverview } from "@/interactions/settings/SettingsDashboard";

@Category(CommandCategory.SETTINGS)
export default class SettingsCommand extends BaseSlashCommand
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            name: "settings",
            description: "Server settings dashboard",
            cooldown: 3,
            usage: "/settings",
            construct: () =>
                new Builder<"SlashCommandBuilder">()
                    .setName("settings")
                    .setDescription("Server settings dashboard"),
        });
    }

    async execute(interaction: Interaction<"ChatInput">): Promise<void>
    {
        if (!interaction.guildId)
        {
            await interaction.reply({
                content: "This command can only be used in a server.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const container = await buildOverview(interaction.guildId);

        await interaction.reply({
            components: [container],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        });
    }
}
