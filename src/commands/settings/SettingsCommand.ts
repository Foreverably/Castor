import {
    BaseSlashCommand,
    Builder,
    Interaction,
} from "@/structures/base/commands/BaseSlashCommand";
import { Category } from "@/structures/base/commands/CommandDecorators";
import { ExtendedClient } from "@/structures/Client";
import { CommandCategory } from "@/types/CommandCategories";
import { ComponentFactory } from "@/utils/ComponentFactory";
import { SETTINGS_KEYS } from "@/types/SETTINGS_KEYS";
import { ContainerBuilder, MessageFlags, SeparatorSpacingSize } from "discord.js";

@Category(CommandCategory.SETTINGS)
export default class SettingsCommand extends BaseSlashCommand
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            name: "settings",
            description: "Configure bot settings.",
            cooldown: 5,
            usage: "/settings",
            devOnly: true,
            construct: () =>
                new Builder<"SlashCommandBuilder">()
                    .setName("settings")
                    .setDescription("Configure bot settings."),
        });
    }

    public async execute(interaction: Interaction<"ChatInput">): Promise<void>
    {
        const options = (SETTINGS_KEYS as readonly string[]).slice(0, 25).map((key) => ({
            label: key,
            value: key,
            description: `Configure ${key}`,
        }));

        if (options.length === 0)
        {
            await interaction.reply({
                content: "No settings are currently configurable.",
                ephemeral: true,
            });
            return;
        }

        const selectMenu = ComponentFactory.createSelectMenu({
            customId: "settings_home_select",
            placeholder: "Select a setting to configure...",
            options: options,
        });

        const component = new ContainerBuilder()
            .addTextDisplayComponents((textDisplay) =>
                textDisplay.setContent(
                    "# Castor Settings\nSelect a setting from the menu below to configure it.",
                ),
            )
            .addSeparatorComponents((separator) =>
                separator.setDivider(true).setSpacing(SeparatorSpacingSize.Large),
            )
            .addActionRowComponents((row) => row.addComponents([selectMenu]));

        await interaction.reply({
            components: [component],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        });
    }
}
