import {
    ComponentType,
    AutocompleteInteraction,
    CacheType,
    InteractionType,
    ContextMenuCommandInteraction,
    StringSelectMenuInteraction,
    ChannelSelectMenuInteraction,
    RoleSelectMenuInteraction,
    ModalSubmitInteraction,
    MentionableSelectMenuInteraction,
    UserSelectMenuInteraction,
    ButtonInteraction,
} from "discord.js";
import { ExtendedClient } from "@/structures/Client";

export type BuilderType = "InteractionListener" | "CommandBuilder" | "ComponentBuilder";

export class InteractionBuilder<T extends BuilderType>
{
    public name?: string;
    public description?: string;
    public customId?: string;
    public interactionType?: InteractionType;
    public componentType?: ComponentType;
    private builderType: T | undefined;

    constructor()
    {
        this.builderType = undefined;
    }

    /**
     * sets the name of the command to listen for.
     * @param name The command name to listen for.
     * @returns The interaction listener.
     */
    public setName(name: string): this
    {
        this.name = name;
        return this;
    }

    /**
     * sets the description for documentation purposes.
     * @param description The description to set.
     * @returns The interaction listener.
     */
    public setDescription(description: string): this
    {
        this.description = description;
        return this;
    }

    /**
     * sets the custom id to listen for.
     * @param customId The custom id to listen for.
     * @returns The interaction listener.
     */
    public setCustomId(customId: string): this
    {
        this.customId = customId;
        return this;
    }

    /**
     * sets the interaction type to listen for.
     * @param interactionType The interaction type to listen for.
     * @returns The interaction listener.
     * If no interaction type is provided, we listen for any interaction type.
     */
    public setInteractionType(interactionType?: InteractionType): this
    {
        this.interactionType = interactionType ?? InteractionType.MessageComponent;
        return this;
    }

    /**
     * sets the component type to listen for.
     * @param componentType The component type to listen for.
     * @returns The interaction listener.
     * If no component type is provided, we listen for any component type.
     */
    public setComponentType(componentType?: ComponentType): this
    {
        if (componentType)
        {
            this.componentType = componentType;
        }
        return this;
    }

    /**
     * Sets the builder type (fluent method for type specification)
     */
    public setBuilderType<U extends BuilderType>(type: U): this
    {
        (this as any).builderType = type;
        return this;
    }
}

export type ComponentInteraction =
    | ButtonInteraction<CacheType>
    | StringSelectMenuInteraction<CacheType>
    | ChannelSelectMenuInteraction<CacheType>
    | RoleSelectMenuInteraction<CacheType>
    | UserSelectMenuInteraction<CacheType>
    | MentionableSelectMenuInteraction<CacheType>
    | ModalSubmitInteraction<CacheType>;

export type InteractionContext<T extends "ContextMenu" | "Autocomplete" | "Component"> =
    T extends "ContextMenu"
        ? ContextMenuCommandInteraction<CacheType>
        : T extends "Autocomplete"
          ? AutocompleteInteraction<CacheType>
          : ComponentInteraction;

export function isComponentInteraction(interaction: any): interaction is ComponentInteraction
{
    return "customId" in interaction;
}

export function isAutocompleteInteraction(
    interaction: any,
): interaction is AutocompleteInteraction
{
    return interaction.isAutocomplete && interaction.isAutocomplete();
}

export function isCommandInteraction(
    interaction: any,
): interaction is ContextMenuCommandInteraction
{
    return interaction.isCommand && interaction.isCommand();
}

export function isMessageComponent(
    interaction: any,
): interaction is Exclude<ComponentInteraction, ModalSubmitInteraction>
{
    return "componentType" in interaction;
}

export function isModalSubmit(interaction: any): interaction is ModalSubmitInteraction
{
    return interaction.isModalSubmit && interaction.isModalSubmit();
}

export interface InteractionListenerOptions
{
    name?: string;
    description?: string;
    customId?: string;
    interactionType?: InteractionType;
    componentType?: ComponentType;
    enabled?: boolean;
    build: () => InteractionBuilder<"InteractionListener">;
}

export abstract class BaseInteractionListener
{
    protected readonly client: ExtendedClient;
    public readonly name?: string;
    public readonly description?: string;
    public readonly customId?: string;
    public readonly interactionType?: InteractionType;
    public readonly componentType?: ComponentType;
    public readonly enabled: boolean;
    public readonly listener: InteractionBuilder<"InteractionListener">;

    constructor(client: ExtendedClient, options: InteractionListenerOptions)
    {
        this.client = client;
        this.enabled = options.enabled ?? true;

        this.listener = options.build();

        this.name = this.listener.name;
        this.description = this.listener.description;
        this.customId = this.listener.customId;
        this.interactionType = this.listener.interactionType;
        this.componentType = this.listener.componentType;
    }

    public abstract onInteraction(
        interaction: InteractionContext<"ContextMenu" | "Autocomplete" | "Component">,
    ): Promise<boolean>;

    public async handle(
        interaction: InteractionContext<"ContextMenu" | "Autocomplete" | "Component">,
    ): Promise<boolean>
    {
        if (!this.enabled)
        {
            return false;
        }

        if (isComponentInteraction(interaction))
        {
            if (!this.customId)
            {
                return false;
            }

            if (interaction.customId !== this.customId)
            {
                return false;
            }

            if (isMessageComponent(interaction))
            {
                if (this.componentType && interaction.componentType !== this.componentType)
                {
                    return false;
                }
            }
            return await this.onInteraction(interaction);
        }

        if (isAutocompleteInteraction(interaction))
        {
            if (!this.name)
            {
                return false;
            }

            if (interaction.commandName !== this.name)
            {
                return false;
            }

            return await this.onInteraction(interaction);
        }

        if (isCommandInteraction(interaction))
        {
            if (!this.name)
            {
                return false;
            }

            if (interaction.commandName !== this.name)
            {
                return false;
            }

            return await this.onInteraction(interaction);
        }

        return false;
    }
}
