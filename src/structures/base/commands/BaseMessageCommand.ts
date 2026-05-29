import { Message, PermissionsBitField } from "discord.js";
import { ExtendedClient } from "@/structures/Client";
import { CommandCategory } from "@/types/CommandCategories";

export interface MessageCommandOptions
{
    name: string;
    description: string;
    category: CommandCategory;
    cooldown?: number;
    usage?: string;
    aliases?: string[];
    permissions?: string[];
    devOnly?: boolean;
    guildOnly?: boolean;
    constraints?: {
        vipChannel?: boolean;
        restrictedFunCommands?: boolean;
        staffOnly?: boolean;
    };
}

export abstract class BaseMessageCommand
{
    protected readonly client: ExtendedClient;
    public readonly name: string;
    public readonly description: string;
    public readonly category: CommandCategory;
    public readonly cooldown: number;
    public readonly usage: string;
    public readonly aliases: string[];
    public readonly permissions: bigint[];
    public readonly devOnly: boolean;
    public readonly guildOnly: boolean;
    public readonly constraints: {
        vipChannel?: boolean;
        restrictedFunCommands?: boolean;
        staffOnly?: boolean;
    };

    constructor(client: ExtendedClient, options: MessageCommandOptions)
    {
        this.client = client;
        this.name = options.name;
        this.description = options.description;
        this.category = options.category;
        this.cooldown = options.cooldown || 0;
        this.usage = options.usage || `/${this.name}`;
        this.aliases = options.aliases || [];
        this.permissions = options.permissions
            ? options.permissions.map(
                  (perm) =>
                      PermissionsBitField.Flags[perm as keyof typeof PermissionsBitField.Flags],
              )
            : [];
        this.devOnly = options.devOnly || false;
        this.guildOnly = options.guildOnly || false;
        this.constraints = options.constraints || {};
    }

    /**
     * Executes the command logic.
     * @param message The message that triggered the command.
     * @param args The arguments parsed from the message content.
     */
    public abstract execute(message: Message, args: string[]): Promise<void>;
}
