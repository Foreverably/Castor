import {
    AutocompleteInteraction,
    CacheType,
    ChatInputCommandInteraction,
    ContextMenuCommandBuilder,
    PermissionsBitField,
    SlashCommandBooleanOption,
    SlashCommandBuilder,
    SlashCommandChannelOption,
    SlashCommandIntegerOption,
    SlashCommandMentionableOption,
    SlashCommandNumberOption,
    SlashCommandOptionsOnlyBuilder,
    SlashCommandRoleOption,
    SlashCommandStringOption,
    SlashCommandSubcommandsOnlyBuilder,
    SlashCommandUserOption,
} from "discord.js";
import { ExtendedClient } from "../../Client";
import { CommandCategory } from "../../../types/CommandCategories";

export interface SlashCommandOptions
{
    name: string;
    description: string;
    category: CommandCategory;
    cooldown?: number;
    usage?: string;
    permissions?: string[];
    devOnly?: boolean;
    guildOnly?: boolean;
    constraints?: {
        vipChannel?: boolean;
        restrictedFunCommands?: boolean;
        staffOnly?: boolean;
    };
    construct: () =>
        | SlashCommandBuilder
        | SlashCommandOptionsOnlyBuilder
        | SlashCommandSubcommandsOnlyBuilder
        | ContextMenuCommandBuilder;
}

export class Builder<T extends "SlashCommandBuilder"> extends SlashCommandBuilder
{
    constructor()
    {
        super();
    }

    public getType(): T
    {
        return "SlashCommandBuilder" as T;
    }
}

export type Interaction<T extends "ChatInput" | "Autocomplete"> = T extends "ChatInput"
    ? ChatInputCommandInteraction
    : AutocompleteInteraction<CacheType>;

export type StringOption = SlashCommandStringOption;
export type IntegerOption = SlashCommandIntegerOption;
export type BooleanOption = SlashCommandBooleanOption;
export type UserOption = SlashCommandUserOption;
export type ChannelOption = SlashCommandChannelOption;
export type RoleOption = SlashCommandRoleOption;
export type MentionableOption = SlashCommandMentionableOption;
export type NumberOption = SlashCommandNumberOption;

export abstract class BaseSlashCommand
{
    public readonly name: string;
    public readonly description: string;
    public readonly category: CommandCategory;
    public readonly cooldown: number;
    public readonly usage: string;
    public readonly permissions: bigint[];
    public readonly devOnly: boolean;
    public readonly guildOnly: boolean;
    public readonly constraints: {
        vipChannel?: boolean;
        restrictedFunCommands?: boolean;
        staffOnly?: boolean;
    };
    public readonly data: SlashCommandBuilder | ContextMenuCommandBuilder;
    protected readonly client: ExtendedClient;

    constructor(client: ExtendedClient, options: SlashCommandOptions)
    {
        this.client = client;
        this.name = options.name;
        this.description = options.description;
        this.category = options.category;
        this.cooldown = options.cooldown || 0;
        this.usage = options.usage || "";
        this.permissions = options.permissions
            ? options.permissions.map(
                  (perm) =>
                      PermissionsBitField.Flags[perm as keyof typeof PermissionsBitField.Flags],
              )
            : [];
        this.devOnly = options.devOnly || false;
        this.guildOnly = options.guildOnly || false;
        this.constraints = options.constraints || {};
        this.data = options.construct() as SlashCommandBuilder | ContextMenuCommandBuilder;
    }

    public abstract execute(interaction: any): Promise<void>;

    public async autocomplete(interaction: Interaction<"Autocomplete">): Promise<void>
    {}
}
