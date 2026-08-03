import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChannelSelectMenuBuilder,
    ChannelSelectMenuInteraction,
    ContainerBuilder,
    MessageFlags,
    RoleSelectMenuBuilder,
    RoleSelectMenuInteraction,
    SectionBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder,
} from "discord.js";
import {
    BaseInteractionListener,
    InteractionBuilder,
    InteractionContext,
} from "@/structures/base";
import { ExtendedClient } from "@/structures/Client";
import {
    BOOLEAN_KEYS,
    CHANNEL_KEYS,
    DEPRECATED_KEYS,
    ROLE_ARRAY_KEYS,
    SINGLE_ROLE_KEYS,
    SettingKey,
    getSettingLabel,
    MODULES,
    Settings,
    type SettingValue,
} from "@/utils";
import { Emoji } from "@/types/Emojis";

function formatValue(key: SettingKey, value: SettingValue | undefined): string
{
    if (value == null) return "*not set*";
    if (BOOLEAN_KEYS.includes(key))
        return value === "true"
            ? `${Emoji.Check} Enabled`
            : `${Emoji.Cross} Disabled`;
    if (Array.isArray(value))
        return value.length ? value.map((id: string) => `<@&${id}>`).join(", ") : "*empty*";
    if (CHANNEL_KEYS.includes(key)) return `<#${value}>`;
    if (SINGLE_ROLE_KEYS.includes(key)) return `<@&${value}>`;
    return String(value);
}

function isActiveKey(key: SettingKey): boolean
{
    return !DEPRECATED_KEYS.includes(key);
}

const ENTRIES_PER_PAGE = 5;

function buildContainerOverview(
    entries: { modId: string; mod: (typeof MODULES)[string]; lines: string[] }[],
    currentPage: number,
    totalPages: number,
): ContainerBuilder
{
    const builder = new ContainerBuilder();

    builder.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `# Settings Dashboard\n` +
                "Browse and manage server settings grouped by module. " +
                "Click a button below to view and edit a module's settings." +
                (totalPages > 1 ? `\n-# Page ${currentPage + 1} of ${totalPages}` : ""),
        ),
    );

    builder.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
    );

    for (let i = 0; i < entries.length; i++)
    {
        const entry = entries[i];

        if (i > 0)
        {
            builder.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
            );
        }

        builder.addSectionComponents(() =>
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${entry.mod.emoji} **${entry.mod.label}**\n${entry.mod.description}\n${entry.lines.join("\n")}`,
                    ),
                )
                .setButtonAccessory((btn) =>
                    btn
                        .setCustomId(`settings_nav_${entry.modId}`)
                        .setLabel(`Manage ${entry.mod.label}`)
                        .setStyle(ButtonStyle.Primary),
                ),
        );
    }

    if (totalPages > 1)
    {
        builder.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
        );

        builder.addActionRowComponents(() =>
        {
            const row = new ActionRowBuilder<ButtonBuilder>();
            if (currentPage > 0)
            {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`settings_page_${currentPage - 1}`)
                        .setLabel("Previous")
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji({ name: "◀️" }),
                );
            }
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`settings_page_${currentPage + 1}`)
                    .setLabel("Next")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji({ name: "▶️" })
                    .setDisabled(currentPage >= totalPages - 1),
            );
            return row;
        });
    }

    return builder;
}

export async function buildOverview(guildId: string, page: number = 0)
{
    const all = await Settings.getAll(guildId);

    const entries: { modId: string; mod: (typeof MODULES)[string]; lines: string[] }[] = [];

    for (const [modId, mod] of Object.entries(MODULES))
    {
        const lines: string[] = [];
        for (const key of mod.keys)
        {
            if (!isActiveKey(key)) continue;
            lines.push(`- **${getSettingLabel(key)}**: ${formatValue(key, all[key])}`);
        }
        entries.push({ modId, mod, lines });
    }

    const totalPages = Math.max(1, Math.ceil(entries.length / ENTRIES_PER_PAGE));
    const currentPage = Math.min(page, totalPages - 1);
    const pageEntries = entries.slice(currentPage * ENTRIES_PER_PAGE, (currentPage + 1) * ENTRIES_PER_PAGE);

    return buildContainerOverview(pageEntries, currentPage, totalPages);
}

async function buildModuleView(guildId: string, modId: string)
{
    const mod = MODULES[modId];
    if (!mod) return null;

    const all = await Settings.getAll(guildId);

    const builder = new ContainerBuilder();

    builder.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `# ${mod.emoji} ${mod.label} Settings\nClick a button below to change a setting.`,
        ),
    );

    for (const key of mod.keys)
    {
        if (!isActiveKey(key)) continue;

        if (BOOLEAN_KEYS.includes(key))
        {
            const isEnabled = all[key] === "true";
            builder.addSectionComponents(() =>
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `**${getSettingLabel(key)}**\n${formatValue(key, all[key])}`,
                        ),
                    )
                    .setButtonAccessory((btn) =>
                        btn
                            .setCustomId(`settings_toggle_${key}`)
                            .setLabel(isEnabled ? "Disable" : "Enable")
                            .setStyle(isEnabled ? ButtonStyle.Danger : ButtonStyle.Success),
                    ),
            );
        }
        else
        {
            builder.addSectionComponents(() =>
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `**${getSettingLabel(key)}**\n${formatValue(key, all[key])}`,
                        ),
                    )
                    .setButtonAccessory((btn) =>
                        btn
                            .setCustomId(`settings_edit_${key}`)
                            .setLabel("Edit")
                            .setStyle(ButtonStyle.Primary),
                    ),
            );
        }
    }

    builder.addSectionComponents(() =>
        new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent("Return to the settings overview."),
            )
            .setButtonAccessory((btn) =>
                btn
                    .setCustomId("settings_back")
                    .setLabel("Back to Overview")
                    .setEmoji({ name: "back", id: "1513646799351578694" })
                    .setStyle(ButtonStyle.Secondary),
            ),
    );

    return builder;
}

async function buildEditView(guildId: string, key: SettingKey, modId: string)
{
    const label = getSettingLabel(key);
    const current = await Settings.get(guildId, key);
    const isRole = ROLE_ARRAY_KEYS.includes(key) || SINGLE_ROLE_KEYS.includes(key);

    let currentIds: string[] = [];
    if (current != null)
    {
        currentIds = Array.isArray(current) ? current : [current].filter(Boolean) as string[];
    }

    const builder = new ContainerBuilder();

    builder.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `# Editing ${label}\n` +
                `Select the ${isRole ? "role(s)" : "channel"} for this setting below. ` +
                "Your selection is saved immediately.",
        ),
    );

    if (isRole)
    {
        const select = new RoleSelectMenuBuilder()
            .setCustomId(`settings_set_role_${key}`)
            .setPlaceholder(ROLE_ARRAY_KEYS.includes(key) ? "Select roles..." : "Select a role...")
            .setMinValues(0)
            .setMaxValues(ROLE_ARRAY_KEYS.includes(key) ? 25 : 1);

        if (currentIds.length > 0) select.setDefaultRoles(...currentIds);

        builder.addActionRowComponents(() =>
            new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(select),
        );
    }
    else if (CHANNEL_KEYS.includes(key))
    {
        const select = new ChannelSelectMenuBuilder()
            .setCustomId(`settings_set_channel_${key}`)
            .setPlaceholder("Select a channel...")
            .setMinValues(0)
            .setMaxValues(1);

        if (currentIds.length > 0) select.setDefaultChannels(...currentIds);

        builder.addActionRowComponents(() =>
            new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(select),
        );
    }

    builder.addSectionComponents(() =>
        new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    "Click **Cancel** to return without saving.",
                ),
            )
            .setButtonAccessory((btn) =>
                btn
                    .setCustomId(`settings_cancel_edit_${modId}`)
                    .setLabel("Cancel")
                    .setStyle(ButtonStyle.Secondary),
            ),
    );

    return builder;
}

export default class SettingsDashboard extends BaseInteractionListener
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            build: () =>
                new InteractionBuilder<"InteractionListener">()
                    .setCustomId("settings_dashboard")
                    .setDescription("Settings dashboard navigation and editing"),
        });
    }

    public async handle(
        interaction: InteractionContext<"ContextMenu" | "Autocomplete" | "Component">,
    ): Promise<boolean>
    {
        if (!this.enabled) return false;

        if (!("customId" in interaction)) return false;
        if (!(interaction as any).customId?.startsWith("settings_")) return false;

        return await this.onInteraction(interaction);
    }

    public async onInteraction(
        interaction: InteractionContext<"ContextMenu" | "Autocomplete" | "Component">,
    ): Promise<boolean>
    {
        if (!interaction.guildId) return false;

        if (!("customId" in interaction)) return false;

        const customId = (interaction as any).customId as string;

        if (!customId.startsWith("settings_")) return false;

        if (interaction.isButton())
        {
            if (customId === "settings_back")
            {
                await this.handleBack(interaction);
                return true;
            }
            if (customId.startsWith("settings_page_"))
            {
                await this.handlePageNav(interaction);
                return true;
            }
            if (customId.startsWith("settings_nav_"))
            {
                await this.handleNav(interaction);
                return true;
            }
            if (customId.startsWith("settings_edit_"))
            {
                await this.handleEdit(interaction);
                return true;
            }
            if (customId.startsWith("settings_toggle_"))
            {
                await this.handleToggle(interaction);
                return true;
            }
            if (customId.startsWith("settings_cancel_edit_"))
            {
                await this.handleCancelEdit(interaction);
                return true;
            }
        }

        if (
            interaction.isRoleSelectMenu() &&
            customId.startsWith("settings_set_role_")
        )
        {
            await this.handleSelect(interaction);
            return true;
        }

        if (
            interaction.isChannelSelectMenu() &&
            customId.startsWith("settings_set_channel_")
        )
        {
            await this.handleSelect(interaction);
            return true;
        }

        return false;
    }

    private async handleNav(interaction: ButtonInteraction): Promise<void>
    {
        const modId = interaction.customId.replace("settings_nav_", "");
        const container = await buildModuleView(interaction.guildId!, modId);
        if (!container)
        {
            await interaction.update({
                components: [],
                content: "Module not found.",
                flags: MessageFlags.IsComponentsV2,
            });
            return;
        }

        await interaction.update({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    }

    private async handleBack(interaction: ButtonInteraction): Promise<void>
    {
        const container = await buildOverview(interaction.guildId!, 0);
        await interaction.update({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    }

    private async handlePageNav(interaction: ButtonInteraction): Promise<void>
    {
        let page = parseInt(interaction.customId.replace("settings_page_", ""), 10);
        if (Number.isNaN(page) || page < 0) page = 0;
        const container = await buildOverview(interaction.guildId!, page);
        await interaction.update({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    }

    private async handleEdit(interaction: ButtonInteraction): Promise<void>
    {
        const key = interaction.customId.replace("settings_edit_", "") as SettingKey;
        const modId = this.findModuleForSetting(key);
        if (!modId) return;

        const container = await buildEditView(interaction.guildId!, key, modId);
        await interaction.update({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    }

    private async handleToggle(interaction: ButtonInteraction): Promise<void>
    {
        const key = interaction.customId.replace("settings_toggle_", "") as SettingKey;
        const guildId = interaction.guildId!;
        const current = await Settings.get(guildId, key);
        const newValue = current === "true" ? "false" : "true";
        await Settings.set(guildId, key, newValue);

        const modId = this.findModuleForSetting(key);
        if (!modId) return;
        const container = await buildModuleView(guildId, modId);
        if (!container) return;
        await interaction.update({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    }

    private async handleCancelEdit(interaction: ButtonInteraction): Promise<void>
    {
        const modId = interaction.customId.replace("settings_cancel_edit_", "");
        const container = await buildModuleView(interaction.guildId!, modId);
        if (!container) return;
        await interaction.update({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    }

    private async handleSelect(
        interaction: RoleSelectMenuInteraction | ChannelSelectMenuInteraction,
    ): Promise<void>
    {
        const key = interaction.customId.replace(/^settings_set_(role|channel)_/, "") as SettingKey;
        const values = interaction.values;
        const guildId = interaction.guildId!;

        if (ROLE_ARRAY_KEYS.includes(key))
        {
            await Settings.set(guildId, key, values);
        }
        else if (SINGLE_ROLE_KEYS.includes(key))
        {
            await Settings.set(guildId, key, values.length > 0 ? values[0] : null);
        }
        else if (CHANNEL_KEYS.includes(key))
        {
            await Settings.set(guildId, key, values.length > 0 ? values[0] : null);
        }

        const modId = this.findModuleForSetting(key);
        if (!modId) return;
        const container = await buildModuleView(guildId, modId);
        if (!container) return;
        await interaction.update({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    }

    private findModuleForSetting(key: SettingKey): string | null
    {
        for (const [modId, mod] of Object.entries(MODULES))
        {
            if (mod.keys.includes(key)) return modId;
        }
        return null;
    }
}
