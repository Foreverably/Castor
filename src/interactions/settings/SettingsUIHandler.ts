import { BaseInteractionListener, InteractionBuilder, InteractionContext } from "@/structures/base";
import { ExtendedClient } from "@/structures/Client";
import {
    ButtonInteraction,
    ComponentType,
    ContainerBuilder,
    InteractionType,
    MessageFlags,
    SeparatorSpacingSize,
    StringSelectMenuInteraction,
} from "discord.js";
import { ComponentFactory } from "@/utils/ComponentFactory";
import { Settings } from "@/utils/Settings";
import { SETTINGS_KEYS } from "@/types/SETTINGS_KEYS";

export default class SettingsUIHandler extends BaseInteractionListener
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            enabled: true,
            build: () =>
                new InteractionBuilder<"InteractionListener">()
                    .setCustomId("settings_ui_handler")
                    .setDescription("Handles all interactions for the Settings UI")
                    .setInteractionType(InteractionType.MessageComponent),
        });
    }

    public override async handle(
        interaction: InteractionContext<"ContextMenu" | "Autocomplete" | "Component">,
    ): Promise<boolean>
    {
        if (!this.enabled) return false;

        if (interaction.isMessageComponent() && interaction.customId.startsWith("settings_"))
        {
            return await this.onInteraction(interaction);
        }

        return false;
    }

    public async onInteraction(interaction: InteractionContext<"Component">): Promise<boolean>
    {
        try
        {
            if (
                interaction.customId === "settings_home_select" &&
                interaction.isStringSelectMenu()
            )
            {
                await this.handleHomeSelect(interaction as StringSelectMenuInteraction);
            }
            else if (interaction.customId === "settings_back" && interaction.isButton())
            {
                await this.handleBack(interaction as ButtonInteraction);
            }
            else if (interaction.customId.startsWith("settings_update_"))
            {
                await this.handleUpdate(interaction);
            }
            else
            {
                const component = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent("Unknown settings action."),
                );
                await interaction.reply({
                    components: [component],
                    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                });
            }
        }
        catch (error)
        {
            this.client.logger.error(
                "[SettingsUIHandler] Error handling settings UI.",
                error as Error,
            );
            if (interaction.replied || interaction.deferred)
            {
                await interaction.followUp({
                    content: "An error occurred.",
                    flags: MessageFlags.Ephemeral,
                });
            }
            else
            {
                await interaction.reply({
                    content: "An error occurred.",
                    flags: MessageFlags.Ephemeral,
                });
            }
        }

        return true;
    }

    private async handleHomeSelect(interaction: StringSelectMenuInteraction): Promise<void>
    {
        const key = interaction.values[0];
        if (!key) return;

        await this.renderSettingEditor(interaction, key);
    }

    private async handleBack(interaction: ButtonInteraction): Promise<void>
    {
        const options = (SETTINGS_KEYS as readonly string[]).slice(0, 25).map((key) => ({
            label: key,
            value: key,
            description: `Configure ${key}`,
        }));

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

        await interaction.update({
            components: [component],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        });
    }

    private async handleUpdate(interaction: InteractionContext<"Component">): Promise<void>
    {
        const parts = interaction.customId.split("_");
        const type = parts.pop() as string;
        const key = parts.slice(2).join("_");

        let successMsg = "Setting updated successfully.";

        if (interaction.isChannelSelectMenu() && (type === "channel" || type === "channels"))
        {
            if (type === "channel")
            {
                const val = interaction.values[0];
                await Settings.set(key, val, "string");
            }
            else
            {
                await Settings.setArray(key, interaction.values);
            }
        }
        else if (interaction.isRoleSelectMenu() && (type === "role" || type === "roles"))
        {
            if (type === "role")
            {
                const val = interaction.values[0];
                await Settings.set(key, val, "string");
            }
            else
            {
                await Settings.setArray(key, interaction.values);
            }
        }
        else if (interaction.isStringSelectMenu() && type === "boolean")
        {
            const val = interaction.values[0] === "true";
            await Settings.set(key, val, "boolean");
        }
        else
        {
            await interaction.reply({
                content: "Unsupported update type.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await this.renderSettingEditor(interaction, key, successMsg);
    }

    private async renderSettingEditor(
        interaction: InteractionContext<"Component">,
        key: string,
        updateMsg?: string,
    ): Promise<void>
    {
        const record = await Settings.getRecord(key);

        let uiType = "channel";

        switch (true)
        {
            case key.includes("roles"):
                uiType = "roles";
                break;

            case key.includes("role"):
                uiType = "role";
                break;

            case key.includes("channels"):
                uiType = "channels";
                break;

            case key.includes("channel"):
                uiType = "channel";
                break;

            case key.includes("enabled") || key.includes("toggle"):
                uiType = "boolean";
                break;

            default:
                uiType = "channel";
                break;
        }

        const currentValue = record ? record.value : "Not Set";
        let displayValue = currentValue;
        let defaultArr: string[] = [];

        if (Array.isArray(currentValue))
        {
            defaultArr = currentValue.map(String);
            displayValue = defaultArr.join(", ") || "None";
        }
        else if (typeof currentValue === "string" && currentValue.match(/^\d+$/))
        {
            defaultArr = [currentValue];
        }

        const messageLines: string[] = [];
        if (updateMsg)
        {
            messageLines.push(
                `**Configuring: \`${key}\`**`,
                `- Value: \`${displayValue}\`\n-# **${updateMsg}**`,
            );
        }
        else
        {
            messageLines.push(`**Configuring: \`${key}\`**`, `- Value: \`${displayValue}\``);
        }

        const textContent = messageLines.join("\n");

        const container = new ContainerBuilder()
            .addTextDisplayComponents((textDisplay) => textDisplay.setContent(textContent))
            .addSeparatorComponents((separator) =>
                separator.setDivider(true).setSpacing(SeparatorSpacingSize.Large),
            );

        if (uiType === "channel" || uiType === "channels")
        {
            const maxValues = uiType === "channel" ? 1 : 25;
            const menu = ComponentFactory.createChannelSelectMenu({
                customId: `settings_update_${key}_${uiType}`,
                placeholder: `Select ${uiType}...`,
                defaultValues: defaultArr.slice(0, maxValues),
                minValues: 0,
                maxValues: maxValues,
            });
            container.addActionRowComponents((row) => row.addComponents([menu]));
        }
        else if (uiType === "role" || uiType === "roles")
        {
            const maxValues = uiType === "role" ? 1 : 25;
            const menu = ComponentFactory.createRoleSelectMenu({
                customId: `settings_update_${key}_${uiType}`,
                placeholder: `Select ${uiType}...`,
                defaultValues: defaultArr.slice(0, maxValues),
                minValues: 0,
                maxValues: maxValues,
            });
            container.addActionRowComponents((row) => row.addComponents([menu]));
        }
        else if (uiType === "boolean")
        {
            const isTrue = currentValue === true || currentValue === "1" || currentValue === "true";
            const menu = ComponentFactory.createSelectMenu({
                customId: `settings_update_${key}_${uiType}`,
                placeholder: "Select True or False...",
                options: [
                    { label: "True", value: "true", default: isTrue },
                    {
                        label: "False",
                        value: "false",
                        default: currentValue !== "Not Set" && !isTrue,
                    },
                ],
            });
            container.addActionRowComponents((row) => row.addComponents([menu]));
        }

        const backBtn = ComponentFactory.createThemedButton("secondary", {
            customId: "settings_back",
            label: "Back to Settings Home",
        });
        container.addActionRowComponents((row) => row.addComponents([backBtn]));

        const payload = {
            content: undefined,
            components: [container],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        };

        if (interaction.isRepliable() && !interaction.replied && !interaction.deferred)
        {
            if (
                interaction.isMessageComponent() ||
                (interaction.isModalSubmit() && interaction.isFromMessage())
            )
            {
                await interaction.update(payload);
            }
            else
            {
                await interaction.reply(payload);
            }
        }
        else
        {
            await interaction.editReply(payload);
        }
    }
}
