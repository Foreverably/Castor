import { Events, GuildMember, Message } from "discord.js";
import { BaseEvent } from "@/structures/base/events/BaseEvent";
import { ExtendedClient } from "@/structures/Client";
import { config } from "@/config";
import { Settings } from "@/utils";
import { SettingsKeys } from "@/types/SETTINGS_KEYS";

export default class MessageCreateEvent extends BaseEvent<Events.MessageCreate>
{
    private readonly prefix: string;

    constructor(client: ExtendedClient)
    {
        super(client, {
            name: Events.MessageCreate,
            modules: [],
            once: false,
        });
        this.prefix = config.prefix;
    }

    async execute(message: Message): Promise<void>
    {
        if (message.author.bot) return;

        this.client.logger.debug(`[Event] Processing message ${message.id} from ${message.author.tag}.`);

        let prefixUsed: string | null = null;
        if (message.content.toLowerCase().startsWith(this.prefix.toLowerCase()))
        {
            prefixUsed = this.prefix;
        }
        else if (message.content.startsWith("?"))
        {
            prefixUsed = "?";
        }

        if (prefixUsed === null) return;

        const args = message.content.slice(prefixUsed.length).trim().split(/\s+/);
        const commandName = args.shift();

        if (!commandName) return;

        const command = this.client.commands.get(commandName);

        if (!command)
        {
            this.client.logger.error(`[Event] No command matching ${commandName} was found.`);
            return;
        }

        if (prefixUsed === "?" && !command.constraints.staffOnly)
        {
            this.client.logger.debug(`[Event] Command ${commandName} is not a staff command but was called with '?' prefix.`);
            return;
        }

        const blacklistRole = await Settings.get<string>(SettingsKeys.commandBlacklist);

        try
        {
            if (
                blacklistRole &&
                message.member instanceof GuildMember &&
                message.member.roles.cache.has(blacklistRole)
            )
            {
                this.client.logger.debug("[Event] Blacklist check failed.", {
                    userId: message.author.id,
                    blacklistRole,
                });
                return;
            }

            if (command.devOnly && !config.developers.includes(message.author.id))
            {
                this.client.logger.debug("[Event] Developer check failed.", {
                    userId: message.author.id,
                    developers: config.developers,
                    isDev: config.developers.includes(message.author.id),
                });
                return;
            }

            if (command.guildOnly && !message.inGuild())
            {
                this.client.logger.debug("[Event] Guild check failed.", {
                    userId: message.author.id,
                    guildId: message.guild?.id,
                    isGuild: message.inGuild(),
                });
                return;
            }

            if (command.constraints.restrictedFunCommands && message.inGuild())
            {
                const allowedRoles = await Settings.get<string | string[]>(
                    SettingsKeys.allowedRestrictedFunCommandRoles,
                );
                if (Array.isArray(allowedRoles))
                {
                    const hasRole = allowedRoles.some((role) =>
                        (message.member as GuildMember).roles.cache.has(role),
                    );
                    if (!hasRole)
                    {
                        this.client.logger.debug("[Event] Restricted fun command check failed.", {
                            userId: message.author.id,
                            allowedRoles,
                        });
                        return;
                    }
                }
            }

            if (command.constraints.staffOnly && message.inGuild())
            {
                const staffRole = await Settings.get<string | string[]>(SettingsKeys.staffRole);
                const staffRoles = Array.isArray(staffRole) ? staffRole : staffRole ? [ staffRole ] : [];
                const hasStaffRole = staffRoles.some((role) =>
                    (message.member as GuildMember).roles.cache.has(role),
                );
                if (!hasStaffRole)
                {
                    this.client.logger.debug("[Event] Staff only check failed.", {
                        userId: message.author.id,
                        staffRoles,
                    });
                    return;
                }
            }

            if (command.constraints.vipChannel && message.inGuild())
            {
                let vipChannelId = await Settings.get<string | string[]>(SettingsKeys.vipChannel);
                if (Array.isArray(vipChannelId)) vipChannelId = vipChannelId[ 0 ];

                if (vipChannelId && message.channelId !== vipChannelId)
                {
                    this.client.logger.debug("[Event] VIP channel check failed.", {
                        userId: message.author.id,
                        vipChannelId,
                        channelId: message.channelId,
                    });
                    return;
                }
            }

            if (command.permissions.length > 0 && message.inGuild())
            {
                const member = message.member as GuildMember;
                if (!member || !command.permissions.every((perm: bigint) => member.permissions.has(perm)))
                {
                    this.client.logger.debug("[Event] Permission check failed.", {
                        userId: message.author.id,
                        permissions: command.permissions,
                        memberPermissions: member?.permissions.toArray(),
                    });
                    return;
                }
            }

            await command.execute(message, [ commandName, ...args ]);
        }
        catch (error)
        {
            this.client.logger.error(`[Event] Error executing command ${commandName}.`, error);
        }
    }
}