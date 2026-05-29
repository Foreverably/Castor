import { Events, GuildMember, Message } from "discord.js";
import { BaseEvent } from "@/structures/base/events/BaseEvent";
import { ExtendedClient } from "@/structures/Client";
import { config } from "@/config";

export default class MessageCreateEvent extends BaseEvent<Events.MessageCreate>
{
	private readonly prefix: string;

	constructor(client: ExtendedClient)
	{
		super(client, {
			name: Events.MessageCreate,
			modules: [],
			once: false
		});
		this.prefix = config.prefix;
	}

	async execute(message: Message): Promise<void>
	{

		if (message.author.bot) return;

		this.client.logger.debug(`[Event] Processing message ${message.id} from ${message.author.tag}.`);

		if (!message.content.toLowerCase().startsWith(this.prefix.toLowerCase())) return;

		const args = message.content.slice(this.prefix.length).trim().split(/\s+/);

		const command = this.client.commands.get(args[ 0 ]);

		if (!command)
		{
			this.client.logger.error(`[Event] No command matching ${args[ 0 ]} was found.`);
			return;
		}

		try
		{
			if (command.devOnly && !config.developers.includes(message.author.id))
			{
				this.client.logger.debug("[Event] Developer check failed.", {
					userId: message.author.id,
					developers: config.developers,
					isDev: config.developers.includes(message.author.id)
				});
				return;
			}

			if (command.guildOnly && !message.inGuild())
			{
				this.client.logger.debug("[Event] Guild check failed.", {
					userId: message.author.id,
					guildId: message.guild?.id,
					isGuild: message.inGuild()
				});
				return;
			}

			if (command.permissions.length > 0 && message.inGuild())
			{
				const member = message.member as GuildMember;
				if (!member || !command.permissions.every((perm: bigint) => member.permissions.has(perm)))
				{
					this.client.logger.debug("[Event] Permission check failed.", {
						userId: message.author.id,
						permissions: command.permissions,
						memberPermissions: member?.permissions.toArray()
					});
					return;
				}
			}

			await command.execute(message, args);
		}
		catch (error)
		{
			this.client.logger.error(`[Event] Error executing command ${args[ 0 ]}.`, error);
		}
	}
} 