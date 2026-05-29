import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    UserSelectMenuBuilder,
    RoleSelectMenuBuilder,
    ChannelSelectMenuBuilder,
    MentionableSelectMenuBuilder,
    TextInputBuilder,
    TextInputStyle,
    EmbedBuilder,
    MessageCreateOptions,
    MessageEditOptions,
    InteractionReplyOptions,
    MessageReplyOptions,
    ComponentType,
    APIActionRowComponent,
    MessageActionRowComponent,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    FileBuilder,
    AttachmentBuilder,
    User,
    SeparatorSpacingSize,
} from "discord.js";

export interface ComponentActionRow
{
    components: Array<
        | ButtonBuilder
        | StringSelectMenuBuilder
        | UserSelectMenuBuilder
        | RoleSelectMenuBuilder
        | ChannelSelectMenuBuilder
        | MentionableSelectMenuBuilder
        | TextInputBuilder
    >;
}

export interface ComponentMessageOptions
{
    components?: ComponentActionRow[];
    ephemeral?: boolean;
    flags?: number;
}

export class ComponentBuilder
{
    private static readonly MAX_COMPONENTS_PER_ROW = 5;
    private static readonly MAX_ACTION_ROWS = 5;
    private static readonly SUPPORTED_COMPONENT_TYPES = [
        ComponentType.Button,
        ComponentType.StringSelect,
        ComponentType.UserSelect,
        ComponentType.RoleSelect,
        ComponentType.ChannelSelect,
        ComponentType.MentionableSelect,
        ComponentType.File,
    ];

    /**
     * Creates a file component
     */
    static file(options: { customId: string; file: Buffer }): FileBuilder
    {
        const file = new AttachmentBuilder(options.file);

        return new FileBuilder().setURL(`attachment://${file.name}`);
    }

    /**
     * Creates a file component
     */
    static fileTest(options: { file: Buffer }): AttachmentBuilder[]
    {
        const file = new AttachmentBuilder(options.file);

        return [file];
    }

    /**
     * Creates a button component
     */
    static button(options: {
        customId?: string;
        label: string;
        style?: ButtonStyle;
        emoji?: string;
        url?: string;
        disabled?: boolean;
    }): ButtonBuilder
    {
        const button = new ButtonBuilder()
            .setLabel(options.label)
            .setDisabled(options.disabled || false);

        if (options.url)
        {
            button.setURL(options.url);
            button.setStyle(ButtonStyle.Link);
        }
        else
        {
            if (!options.customId)
            {
                throw new Error("customId is required for non-link buttons");
            }
            button.setCustomId(options.customId);
            button.setStyle(options.style || ButtonStyle.Primary);
        }

        if (options.emoji)
        {
            button.setEmoji(options.emoji);
        }

        return button;
    }

    /**
     * Creates a string select menu component
     */
    static stringSelect(options: {
        customId: string;
        placeholder?: string;
        minValues?: number;
        maxValues?: number;
        disabled?: boolean;
        options: Array<{
            label: string;
            value: string;
            description?: string;
            emoji?: string;
            default?: boolean;
        }>;
    }): StringSelectMenuBuilder
    {
        const select = new StringSelectMenuBuilder()
            .setCustomId(options.customId)
            .setDisabled(options.disabled || false);

        if (options.placeholder)
        {
            select.setPlaceholder(options.placeholder);
        }

        if (options.minValues !== undefined)
        {
            select.setMinValues(options.minValues);
        }

        if (options.maxValues !== undefined)
        {
            select.setMaxValues(options.maxValues);
        }

        const selectOptions = options.options.map((opt) =>
        {
            const optionBuilder = new StringSelectMenuOptionBuilder()
                .setLabel(opt.label)
                .setValue(opt.value)
                .setDefault(opt.default || false);

            if (opt.description && opt.description.trim() !== "")
            {
                optionBuilder.setDescription(opt.description);
            }

            if (opt.emoji && opt.emoji.trim() !== "")
            {
                optionBuilder.setEmoji(opt.emoji);
            }

            return optionBuilder;
        });

        return select.addOptions(selectOptions);
    }

    /**
     * Creates a user select menu component
     */
    static userSelect(options: {
        customId: string;
        placeholder?: string;
        minValues?: number;
        maxValues?: number;
        disabled?: boolean;
    }): UserSelectMenuBuilder
    {
        const select = new UserSelectMenuBuilder()
            .setCustomId(options.customId)
            .setDisabled(options.disabled || false);

        if (options.placeholder)
        {
            select.setPlaceholder(options.placeholder);
        }

        if (options.minValues !== undefined)
        {
            select.setMinValues(options.minValues);
        }

        if (options.maxValues !== undefined)
        {
            select.setMaxValues(options.maxValues);
        }

        return select;
    }

    /**
     * Creates a role select menu component
     */
    static roleSelect(options: {
        customId: string;
        placeholder?: string;
        minValues?: number;
        maxValues?: number;
        disabled?: boolean;
    }): RoleSelectMenuBuilder
    {
        const select = new RoleSelectMenuBuilder()
            .setCustomId(options.customId)
            .setDisabled(options.disabled || false);

        if (options.placeholder)
        {
            select.setPlaceholder(options.placeholder);
        }

        if (options.minValues !== undefined)
        {
            select.setMinValues(options.minValues);
        }

        if (options.maxValues !== undefined)
        {
            select.setMaxValues(options.maxValues);
        }

        return select;
    }

    /**
     * Creates a channel select menu component
     */
    static channelSelect(options: {
        customId: string;
        placeholder?: string;
        minValues?: number;
        maxValues?: number;
        disabled?: boolean;
    }): ChannelSelectMenuBuilder
    {
        const select = new ChannelSelectMenuBuilder()
            .setCustomId(options.customId)
            .setDisabled(options.disabled || false);

        if (options.placeholder)
        {
            select.setPlaceholder(options.placeholder);
        }

        if (options.minValues !== undefined)
        {
            select.setMinValues(options.minValues);
        }

        if (options.maxValues !== undefined)
        {
            select.setMaxValues(options.maxValues);
        }

        return select;
    }

    /**
     * Creates a mentionable select menu component
     */
    static mentionableSelect(options: {
        customId: string;
        placeholder?: string;
        minValues?: number;
        maxValues?: number;
        disabled?: boolean;
    }): MentionableSelectMenuBuilder
    {
        const select = new MentionableSelectMenuBuilder()
            .setCustomId(options.customId)
            .setDisabled(options.disabled || false);

        if (options.placeholder)
        {
            select.setPlaceholder(options.placeholder);
        }

        if (options.minValues !== undefined)
        {
            select.setMinValues(options.minValues);
        }

        if (options.maxValues !== undefined)
        {
            select.setMaxValues(options.maxValues);
        }

        return select;
    }

    /**
     * Creates a text input component
     */
    static textInput(options: {
        customId: string;
        label: string;
        style?: TextInputStyle;
        placeholder?: string;
        value?: string;
        required?: boolean;
        minLength?: number;
        maxLength?: number;
    }): TextInputBuilder
    {
        const input = new TextInputBuilder()
            .setCustomId(options.customId)
            .setLabel(options.label)
            .setStyle(options.style || TextInputStyle.Short)
            .setRequired(options.required !== false);

        if (options.placeholder)
        {
            input.setPlaceholder(options.placeholder);
        }

        if (options.value)
        {
            input.setValue(options.value);
        }

        if (options.minLength !== undefined)
        {
            input.setMinLength(options.minLength);
        }

        if (options.maxLength !== undefined)
        {
            input.setMaxLength(options.maxLength);
        }

        return input;
    }

    /**
     * Creates an action row with components (Components v2)
     */
    static actionRow(
        ...components: Array<
            | ButtonBuilder
            | StringSelectMenuBuilder
            | UserSelectMenuBuilder
            | RoleSelectMenuBuilder
            | ChannelSelectMenuBuilder
            | MentionableSelectMenuBuilder
            | TextInputBuilder
        >
    ): ActionRowBuilder<any>
    {
        if (components.length === 0)
        {
            throw new Error("Action row must have at least 1 component");
        }

        if (components.length > this.MAX_COMPONENTS_PER_ROW)
        {
            throw new Error(
                `Action row cannot have more than ${this.MAX_COMPONENTS_PER_ROW} components (Components v2 limit)`,
            );
        }

        for (const component of components)
        {
            if (!this.isValidComponent(component))
            {
                throw new Error(
                    `Invalid component type for Components v2: ${component.constructor.name}`,
                );
            }
        }

        return new ActionRowBuilder().addComponents(...components);
    }

    /**
     * Validates if a component is supported in Components v2
     */
    private static isValidComponent(component: any): boolean
    {
        if (typeof component.toJSON === "function")
        {
            const json = component.toJSON();
            return this.SUPPORTED_COMPONENT_TYPES.includes(json.type);
        }
        return false;
    }

    /**
     * Creates multiple action rows from an array of components, automatically splitting into rows of 5 (Components v2)
     */
    static actionRows(
        components: Array<
            | ButtonBuilder
            | StringSelectMenuBuilder
            | UserSelectMenuBuilder
            | RoleSelectMenuBuilder
            | ChannelSelectMenuBuilder
            | MentionableSelectMenuBuilder
            | TextInputBuilder
        >,
    ): ActionRowBuilder<any>[]
    {
        if (components.length === 0)
        {
            throw new Error("Components array cannot be empty");
        }

        const rows: ActionRowBuilder<any>[] = [];
        const chunks = this.chunkArray(components, this.MAX_COMPONENTS_PER_ROW);

        if (chunks.length > this.MAX_ACTION_ROWS)
        {
            throw new Error(
                `Cannot create more than ${this.MAX_ACTION_ROWS} action rows (Components v2 limit)`,
            );
        }

        for (const chunk of chunks)
        {
            rows.push(this.actionRow(...chunk));
        }

        return rows;
    }

    /**
     * Creates a message with components (Components v2)
     * Note: Components v2 cannot use traditional embeds, content, polls, or stickers
     */
    static message(
        options: ComponentMessageOptions,
    ): MessageCreateOptions & MessageEditOptions & InteractionReplyOptions & MessageReplyOptions
    {
        const messageOptions: any = {};

        if (options.components)
        {
            this.validateComponents(options.components);
            messageOptions.components = options.components;
        }

        if (options.ephemeral !== undefined)
        {
            messageOptions.ephemeral = options.ephemeral;
        }

        messageOptions.flags = (messageOptions.flags || 0) | MessageFlags.IsComponentsV2;

        return messageOptions;
    }

    /**
     * Validates components array for Components v2 compliance
     */
    private static validateComponents(components: ComponentActionRow[]): void
    {
        if (components.length > this.MAX_ACTION_ROWS)
        {
            throw new Error(
                `Cannot have more than ${this.MAX_ACTION_ROWS} action rows (Components v2 limit)`,
            );
        }

        for (let i = 0; i < components.length; i++)
        {
            const row = components[i];
            if (!row.components || row.components.length === 0)
            {
                throw new Error(`Action row ${i + 1} cannot be empty (Components v2)`);
            }

            if (row.components.length > this.MAX_COMPONENTS_PER_ROW)
            {
                throw new Error(
                    `Action row ${i + 1} cannot have more than ${this.MAX_COMPONENTS_PER_ROW} components (Components v2)`,
                );
            }
        }
    }

    /**
     * Helper method to chunk arrays
     */
    private static chunkArray<T>(array: T[], chunkSize: number): T[][]
    {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += chunkSize)
        {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    /**
     * Creates a persistent component with state management (Components v2)
     */
    static persistentComponent(options: {
        customId: string;
        type: "button" | "select";
        data?: any;
        expiresAt?: Date;
    }): ButtonBuilder | StringSelectMenuBuilder
    {
        const baseId = `${options.customId}:${Date.now()}`;

        if (options.type === "button")
        {
            return this.button({
                customId: baseId,
                label: "Component",
                style: ButtonStyle.Secondary,
            });
        }
        else
        {
            return this.stringSelect({
                customId: baseId,
                placeholder: "Choose an option...",
                options: [{ label: "Default", value: "default" }],
            });
        }
    }

    static preset = {
        /**
         * Creates a simple confirmation dialog with Yes/No buttons (Components v2)
         */
        confirmation: (
            options: {
                yesId?: string;
                noId?: string;
                yesLabel?: string;
                noLabel?: string;
                yesStyle?: ButtonStyle;
                noStyle?: ButtonStyle;
            } = {},
        ) =>
        {
            const yesButton = this.button({
                customId: options.yesId || "confirm_yes",
                label: options.yesLabel || "Yes",
                style: options.yesStyle || ButtonStyle.Success,
            });

            const noButton = this.button({
                customId: options.noId || "confirm_no",
                label: options.noLabel || "No",
                style: options.noStyle || ButtonStyle.Danger,
            });

            return this.actionRow(yesButton, noButton);
        },

        /**
         * Creates a pagination component with Previous/Next buttons (Components v2)
         */
        pagination: (
            options: {
                prevId?: string;
                nextId?: string;
                prevLabel?: string;
                nextLabel?: string;
                prevDisabled?: boolean;
                nextDisabled?: boolean;
            } = {},
        ) =>
        {
            const prevButton = this.button({
                customId: options.prevId || "paginate_prev",
                label: options.prevLabel || "Previous",
                style: ButtonStyle.Secondary,
                disabled: options.prevDisabled || false,
            });

            const nextButton = this.button({
                customId: options.nextId || "paginate_next",
                label: options.nextLabel || "Next",
                style: ButtonStyle.Secondary,
                disabled: options.nextDisabled || false,
            });

            return this.actionRow(prevButton, nextButton);
        },

        /**
         * Creates a dropdown for common actions (Components v2)
         */
        actionSelect: (actions: Array<{ label: string; value: string; description?: string }>) =>
        {
            if (!actions || actions.length === 0)
            {
                throw new Error("Actions array cannot be empty (Components v2)");
            }

            if (actions.length > 25)
            {
                throw new Error(
                    "Cannot have more than 25 options in a select menu (Components v2)",
                );
            }

            return this.actionRow(
                this.stringSelect({
                    customId: "action_select",
                    placeholder: "Choose an action...",
                    options: actions,
                }),
            );
        },

        /**
         * Creates a quick poll with reaction buttons (Components v2)
         */
        quickPoll: (options: {
            question: string;
            options: Array<{ label: string; emoji?: string }>;
        }) =>
        {
            if (options.options.length > 4)
            {
                throw new Error("Quick poll cannot have more than 4 options (Components v2)");
            }

            const buttons = options.options.map((option, index) =>
                this.button({
                    customId: `poll_option_${index}`,
                    label: option.label,
                    emoji: option.emoji,
                    style: ButtonStyle.Secondary,
                }),
            );

            return this.actionRow(...buttons);
        },

        /**
         * Creates a role selection menu (Components v2)
         */
        roleSelector: (
            roles: Array<{ label: string; value: string; description?: string; emoji?: string }>,
        ) =>
        {
            if (!roles || roles.length === 0)
            {
                throw new Error("Roles array cannot be empty (Components v2)");
            }

            return this.actionRow(
                this.stringSelect({
                    customId: "role_select",
                    placeholder: "Select a role...",
                    minValues: 0,
                    maxValues: Math.min(roles.length, 25),
                    options: roles,
                }),
            );
        },
    };
}
