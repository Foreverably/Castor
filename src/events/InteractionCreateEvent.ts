import { Events, GuildMember, MessageFlags } from "discord.js";
import { ExtendedClient } from "@/structures/Client";
import { Interaction } from "@/structures/base/commands/BaseSlashCommand";
import { BaseEvent } from "@/structures/base/events/BaseEvent";
import { config } from "@/config";
import { Settings } from "@/utils";
import { SettingKey } from "@/types/SettingKey";

export default class InteractionCreateEvent extends BaseEvent<Events.InteractionCreate>
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            name: Events.InteractionCreate,
            modules: [],
            once: false,
        });
    }

    public async execute(interaction: Interaction<"ChatInput" | "Autocomplete">): Promise<void>
    {
        await this.client.interactionHandler.handleInteraction(interaction);

        if (interaction.isAutocomplete())
        {
            try
            {
                const command = this.client.interactions.get(interaction.commandName);

                if (!command)
                {
                    this.client.logger.error(
                        `[Event] No command matching ${interaction.commandName} was found.`,
                    );
                    return;
                }
                await command.autocomplete(interaction as Interaction<"Autocomplete">);
            }
            catch (error: any)
            {
                await this.client.errorHandler.handleError(error, {
                    user: interaction.user,
                    guild: interaction.guild ?? undefined,
                    command: interaction.commandName,
                    autocomplete: interaction,
                });
            }
        }

        if (interaction.isChatInputCommand() || interaction.isContextMenuCommand())
        {
            const command = this.client.interactions.get(interaction.commandName);

            if (!command)
            {
                this.client.logger.error(
                    `[Event] No command matching ${interaction.commandName} was found.`,
                );
                return;
            }

            try
            {
                const guildId = interaction.guildId;
                const settings = guildId ? await Settings.getAll(guildId) : {};

                if (guildId)
                {
                    const blacklistRole = settings[SettingKey.CommandBlacklist];

                    if (
                        blacklistRole &&
                        typeof blacklistRole === "string" &&
                        interaction.member instanceof GuildMember &&
                        interaction.member.roles.cache.has(blacklistRole)
                    )
                    {
                        await interaction.reply({
                            content: "You are blacklisted from using this command.",
                            flags: MessageFlags.Ephemeral,
                        });
                        return;
                    }
                }

                if (command.devOnly && !config.developers.includes(interaction.user.id))
                {
                    this.client.logger.debug("[Event] Developer check failed.", {
                        userId: interaction.user.id,
                        developers: config.developers,
                        isDev: config.developers.includes(interaction.user.id),
                    });
                    await interaction.reply({
                        content: "This command is only available to bot developers.",
                        flags: MessageFlags.Ephemeral,
                    });
                    return;
                }

                if (command.guildOnly && !interaction.inGuild())
                {
                    await interaction.reply({
                        content: "This command can only be used in a server!",
                        flags: MessageFlags.Ephemeral,
                    });
                    return;
                }

                if (command.constraints.restrictedFunCommands && guildId && interaction.inGuild())
                {
                    const allowedRoles = settings[SettingKey.RestrictedFunCommandRoles];
                    if (Array.isArray(allowedRoles))
                    {
                        const hasRole = allowedRoles.some((role) =>
                            (interaction.member as GuildMember).roles.cache.has(role),
                        );
                        if (!hasRole)
                        {
                            await interaction.reply({
                                content: "You do not have permission to use this command.",
                                flags: MessageFlags.Ephemeral,
                            });
                            return;
                        }
                    }
                }

                if (command.constraints.staffOnly && guildId && interaction.inGuild())
                {
                    const staffRole = settings[SettingKey.StaffRoles];
                    const staffRoles = Array.isArray(staffRole) ? staffRole : staffRole && typeof staffRole === "string" ? [staffRole] : [];
                    const hasStaffRole = staffRoles.some((role) =>
                        (interaction.member as GuildMember).roles.cache.has(role),
                    );
                    if (!hasStaffRole)
                    {
                        await interaction.reply({
                            content: "This command is only available to staff members.",
                            flags: MessageFlags.Ephemeral,
                        });
                        return;
                    }
                }

                if (command.constraints.vipChannel && guildId && interaction.inGuild())
                {
                    let vipChannelId = settings[SettingKey.VipChannel];
                    if (Array.isArray(vipChannelId)) vipChannelId = vipChannelId[0];

                    if (vipChannelId && typeof vipChannelId === "string" && interaction.channelId !== vipChannelId)
                    {
                        await interaction.reply({
                            content: `This command can only be used in the VIP channel (<#${vipChannelId}>)!`,
                            flags: MessageFlags.Ephemeral,
                        });
                        return;
                    }
                }

                if (command.permissions.length > 0 && interaction.inGuild())
                {
                    const member = interaction.member as GuildMember;
                    if (
                        !member ||
                        !command.permissions.every((perm: bigint) => member.permissions.has(perm))
                    )
                    {
                        await interaction.reply({
                            content: "You do not have permission to use this command.",
                            flags: MessageFlags.Ephemeral,
                        });
                        return;
                    }
                }

                await command.execute(interaction as any);
            }
            catch (error: any)
            {
                await this.client.errorHandler.handleError(error, {
                    user: interaction.user,
                    guild: interaction.guild ?? undefined,
                    command: interaction.commandName,
                    interaction,
                });

                if (interaction.replied || interaction.deferred)
                {
                    await interaction.followUp({
                        content: "There was an error executing this command!",
                        flags: MessageFlags.Ephemeral,
                    });
                }
                else
                {
                    await interaction.reply({
                        content: "There was an error executing this command!",
                        flags: MessageFlags.Ephemeral,
                    });
                }
            }
        }
    }
}
