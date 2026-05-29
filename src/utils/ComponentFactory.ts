import {
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    TextDisplayBuilder,
    ActionRowBuilder,
    ComponentBuilder,
    ContainerBuilder,
    SectionBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    ThumbnailBuilder,
    FileBuilder,
    MediaGalleryBuilder,
    AnyAPIActionRowComponent,
    ChannelSelectMenuBuilder,
    RoleSelectMenuBuilder,
} from "discord.js";
import { ContainerTemplate, ContainerTemplateOptions } from "./templates/ContainerTemplate";
import { SectionTemplate, SectionTemplateOptions } from "./templates/SectionTemplate";

/**
 * Type representing available component types.
 *
 * @typedef {('button' | 'select' | 'textDisplay' | 'actionRow' | 'container' | 'section' | 'separator' | 'thumbnail' | 'file' | 'mediaGallery')} ComponentType
 */
export type ComponentType =
    | "button"
    | "select"
    | "textDisplay"
    | "actionRow"
    | "container"
    | "section"
    | "separator"
    | "thumbnail"
    | "file"
    | "mediaGallery";

/**
 * Options for creating a button component.
 *
 * @interface ButtonOptions
 */
export interface ButtonOptions
{
    /** Unique identifier for the button (required for non-link buttons) */
    customId: string;
    /** Text label displayed on the button */
    label: string;
    /** Button style (Primary, Secondary, Success, Danger, or Link) */
    style?: ButtonStyle;
    /** Emoji to display on the button (string or emoji object) */
    emoji?: string;
    /** Whether the button is disabled */
    disabled?: boolean;
    /** URL for link-style buttons */
    url?: string;
}

/**
 * Options for creating a string select menu component.
 *
 * @interface SelectMenuOptions
 */
export interface SelectMenuOptions
{
    /** Unique identifier for the select menu */
    customId: string;
    /** Placeholder text shown when no option is selected */
    placeholder?: string;
    /** Array of select menu options */
    options: Array<{
        /** Display label for the option */
        label: string;
        /** Value returned when this option is selected */
        value: string;
        /** Optional description shown below the label */
        description?: string;
        /** Optional emoji to display with the option */
        emoji?: string;
        /** Whether this option is selected by default */
        default?: boolean;
    }>;
    /** Minimum number of values that must be selected */
    minValues?: number;
    /** Maximum number of values that can be selected */
    maxValues?: number;
    /** Whether the select menu is disabled */
    disabled?: boolean;
}

/**
 * Options for creating an auto-populated select menu component (like channels or roles).
 *
 * @interface AutoPopulatedSelectMenuOptions
 */
export interface AutoPopulatedSelectMenuOptions
{
    /** Unique identifier for the select menu */
    customId: string;
    /** Placeholder text shown when no option is selected */
    placeholder?: string;
    /** Array of default values (IDs) to pre-select */
    defaultValues?: string[];
    /** Minimum number of values that must be selected */
    minValues?: number;
    /** Maximum number of values that can be selected */
    maxValues?: number;
    /** Whether the select menu is disabled */
    disabled?: boolean;
}

/**
 * Options for creating a text display component.
 *
 * @interface TextDisplayOptions
 */
export interface TextDisplayOptions
{
    /** Text content to display (supports markdown) */
    content: string;
    /** Whether markdown is enabled (default: true) */
    markdown?: boolean;
}

/**
 * Factory class for creating Discord.js component templates and builders.
 * Provides a fluent API for building Components V2 components (containers, sections, etc.)
 * and traditional components (buttons, select menus, etc.).
 *
 * @class ComponentFactory
 *
 * @example
 * ```typescript
 * // Create a container with sections
 * const container = ComponentFactory.createContainer()
 *     .setAccentColor(0x5865F2)
 *     .addSectionComponents((section) =>
 *         section
 *             .addTextDisplayComponents((textDisplay) =>
 *                 textDisplay.setContent('Hello World')
 *             )
 *             .setThumbnailAccessory((thumbnail) =>
 *                 thumbnail.setURL('https://example.com/image.png')
 *             )
 *     );
 *
 * // Create themed buttons
 * const button = ComponentFactory.createThemedButton('primary', {
 *     customId: 'click_me',
 *     label: 'Click Me'
 * });
 * ```
 */
export class ComponentFactory
{
    /**
     * Creates a button component.
     *
     * @static
     * @param {ButtonOptions} options - Options for the button
     * @returns {ButtonBuilder} A new ButtonBuilder instance
     *
     * @example
     * ```typescript
     * const button = ComponentFactory.createButton({
     *     customId: 'my_button',
     *     label: 'Click Me',
     *     style: ButtonStyle.Primary,
     *     emoji: '👍'
     * });
     * ```
     */
    public static createButton(options: ButtonOptions): ButtonBuilder
    {
        const button = new ButtonBuilder().setCustomId(options.customId).setLabel(options.label);

        if (options.style) button.setStyle(options.style);
        if (options.emoji) button.setEmoji(options.emoji);
        if (options.disabled !== undefined) button.setDisabled(options.disabled);
        if (options.url) button.setURL(options.url);

        return button;
    }

    /**
     * Create a themed button
     */
    public static createThemedButton(
        theme: "primary" | "success" | "danger" | "secondary" | "link",
        options: Omit<ButtonOptions, "style">,
    ): ButtonBuilder
    {
        const themeStyles = {
            primary: ButtonStyle.Primary,
            success: ButtonStyle.Success,
            danger: ButtonStyle.Danger,
            secondary: ButtonStyle.Secondary,
            link: ButtonStyle.Link,
        };

        return this.createButton({
            ...options,
            style: themeStyles[theme],
        });
    }

    /**
     * Creates a string select menu component.
     *
     * @static
     * @param {SelectMenuOptions} options - Options for the select menu
     * @returns {StringSelectMenuBuilder} A new StringSelectMenuBuilder instance
     *
     * @example
     * ```typescript
     * const selectMenu = ComponentFactory.createSelectMenu({
     *     customId: 'choose_option',
     *     placeholder: 'Select an option...',
     *     options: [
     *         { label: 'Option 1', value: 'opt1' },
     *         { label: 'Option 2', value: 'opt2', description: 'Second option' }
     *     ],
     *     minValues: 1,
     *     maxValues: 1
     * });
     * ```
     */
    public static createSelectMenu(options: SelectMenuOptions): StringSelectMenuBuilder
    {
        const menu = new StringSelectMenuBuilder()
            .setCustomId(options.customId)
            .addOptions(options.options);

        if (options.placeholder) menu.setPlaceholder(options.placeholder);
        if (options.minValues !== undefined) menu.setMinValues(options.minValues);
        if (options.maxValues !== undefined) menu.setMaxValues(options.maxValues);
        if (options.disabled !== undefined) menu.setDisabled(options.disabled);

        return menu;
    }

    /**
     * Creates a channel select menu component.
     *
     * @static
     */
    public static createChannelSelectMenu(
        options: AutoPopulatedSelectMenuOptions,
    ): ChannelSelectMenuBuilder
    {
        const menu = new ChannelSelectMenuBuilder().setCustomId(options.customId);

        if (options.placeholder) menu.setPlaceholder(options.placeholder);
        if (options.minValues !== undefined) menu.setMinValues(options.minValues);
        if (options.maxValues !== undefined) menu.setMaxValues(options.maxValues);
        if (options.disabled !== undefined) menu.setDisabled(options.disabled);
        if (options.defaultValues && options.defaultValues.length > 0)
            menu.setDefaultChannels(options.defaultValues);

        return menu;
    }

    /**
     * Creates a role select menu component.
     *
     * @static
     */
    public static createRoleSelectMenu(
        options: AutoPopulatedSelectMenuOptions,
    ): RoleSelectMenuBuilder
    {
        const menu = new RoleSelectMenuBuilder().setCustomId(options.customId);

        if (options.placeholder) menu.setPlaceholder(options.placeholder);
        if (options.minValues !== undefined) menu.setMinValues(options.minValues);
        if (options.maxValues !== undefined) menu.setMaxValues(options.maxValues);
        if (options.disabled !== undefined) menu.setDisabled(options.disabled);
        if (options.defaultValues && options.defaultValues.length > 0)
            menu.setDefaultRoles(options.defaultValues);

        return menu;
    }

    /**
     * Creates a text display component for Components V2.
     *
     * @static
     * @param {TextDisplayOptions} options - Options for the text display
     * @returns {TextDisplayBuilder} A new TextDisplayBuilder instance
     *
     * @example
     * ```typescript
     * const textDisplay = ComponentFactory.createTextDisplay({
     *     content: '# Hello World\nThis supports **markdown**!'
     * });
     * ```
     */
    public static createTextDisplay(options: TextDisplayOptions): TextDisplayBuilder
    {
        return new TextDisplayBuilder().setContent(options.content);
    }

    /**
     * Creates an action row component (for traditional components).
     * Returns serialized JSON, so no need to call `.toJSON()`.
     *
     * @static
     * @param {Array<ButtonBuilder | StringSelectMenuBuilder>} components - Components to add to the action row
     * @returns {AnyAPIActionRowComponent} Serialized action row component
     *
     * @example
     * ```typescript
     * const button1 = ComponentFactory.createThemedButton('primary', {
     *     customId: 'btn1',
     *     label: 'Button 1'
     * });
     * const button2 = ComponentFactory.createThemedButton('secondary', {
     *     customId: 'btn2',
     *     label: 'Button 2'
     * });
     *
     * const actionRow = ComponentFactory.createActionRow([button1, button2]);
     * ```
     */
    public static createActionRow(
        components: (
            | ButtonBuilder
            | StringSelectMenuBuilder
            | ChannelSelectMenuBuilder
            | RoleSelectMenuBuilder
        )[],
    ): AnyAPIActionRowComponent
    {
        return new ActionRowBuilder().addComponents(...components).toJSON();
    }

    /**
     * Create a container template
     */
    public static createContainer(options: ContainerTemplateOptions = {}): ContainerTemplate
    {
        return new ContainerTemplate(options);
    }

    /**
     * Creates a section template for Components V2.
     * Sections represent text content with an accessory (thumbnail or button).
     * **IMPORTANT:** Sections REQUIRE an accessory.
     *
     * @static
     * @param {SectionTemplateOptions} [options={}] - Options for creating the section
     * @returns {SectionTemplate} A new SectionTemplate instance
     *
     * @example
     * ```typescript
     * const section = ComponentFactory.createSection()
     *     .addTextDisplayComponents((textDisplay) =>
     *         textDisplay.setContent('Section content')
     *     )
     *     .setThumbnailAccessory((thumbnail) =>
     *         thumbnail.setURL('https://example.com/image.png')
     *     );
     * ```
     */
    public static createSection(options: SectionTemplateOptions = {}): SectionTemplate
    {
        return new SectionTemplate(options);
    }

    /**
     * Create a new SectionBuilder (for direct use with fluent API)
     * Example: ComponentFactory.newSection().addTextDisplayComponents(...).setThumbnailAccessory(...)
     */
    public static newSection(): SectionBuilder
    {
        return new SectionBuilder();
    }

    /**
     * Creates a new ContainerBuilder for direct use with Discord.js fluent API.
     * Useful when you want to use Discord.js builders directly without the template wrapper.
     *
     * @static
     * @returns {ContainerBuilder} A new ContainerBuilder instance
     *
     * @example
     * ```typescript
     * const container = ComponentFactory.newContainer()
     *     .setAccentColor(0x5865F2)
     *     .addSectionComponents((section) =>
     *         section.addTextDisplayComponents((textDisplay) =>
     *             textDisplay.setContent('Content')
     *         )
     *     );
     * ```
     */
    public static newContainer(): ContainerBuilder
    {
        return new ContainerBuilder();
    }

    /**
     * Create a separator
     */
    public static createSeparator(
        spacing: SeparatorSpacingSize = SeparatorSpacingSize.Small,
        divider: boolean = true,
    ): SeparatorBuilder
    {
        return new SeparatorBuilder().setSpacing(spacing).setDivider(divider);
    }

    /**
     * Creates a thumbnail component for Components V2.
     * Typically used as an accessory for sections.
     *
     * @static
     * @param {string} url - URL of the thumbnail image (supports attachment:// URLs)
     * @param {string} [description] - Alt text/description for the thumbnail
     * @param {boolean} [spoiler=false] - Whether the thumbnail should be marked as a spoiler
     * @returns {ThumbnailBuilder} A new ThumbnailBuilder instance
     *
     * @example
     * ```typescript
     * const thumbnail = ComponentFactory.createThumbnail(
     *     'attachment://image.png',
     *     'Alt text for the image',
     *     false
     * );
     *
     * // Or with external URL
     * const thumbnail2 = ComponentFactory.createThumbnail(
     *     'https://example.com/image.png',
     *     'External image'
     * );
     * ```
     */
    public static createThumbnail(
        url: string,
        description?: string,
        spoiler: boolean = false,
    ): ThumbnailBuilder
    {
        const thumbnail = new ThumbnailBuilder().setURL(url).setSpoiler(spoiler);

        if (description) thumbnail.setDescription(description);

        return thumbnail;
    }

    /**
     * Create a file component
     */
    public static createFile(url: string, spoiler: boolean = false): FileBuilder
    {
        return new FileBuilder().setURL(url).setSpoiler(spoiler);
    }

    /**
     * Creates a media gallery component for Components V2.
     * Used to display multiple images/media items in a gallery format.
     *
     * @static
     * @param {Array<{url: string, description?: string}>} items - Array of media items
     * @returns {MediaGalleryBuilder} A new MediaGalleryBuilder instance
     *
     * @example
     * ```typescript
     * const gallery = ComponentFactory.createMediaGallery([
     *     { url: 'https://example.com/image1.png', description: 'First image' },
     *     { url: 'https://example.com/image2.png', description: 'Second image' }
     * ]);
     * ```
     */
    public static createMediaGallery(
        items: Array<{ url: string; description?: string }>,
    ): MediaGalleryBuilder
    {
        return new MediaGalleryBuilder().addItems(
            items.map((item) => ({
                media: { url: item.url },
                description: item.description,
            })),
        );
    }

    /**
     * Creates a complete message object with Components V2 support.
     * Helper method to create a properly formatted message payload.
     *
     * @static
     * @param {string} content - Message content
     * @param {Array<ContainerBuilder | ActionRowBuilder>} components - Array of components
     * @param {boolean} [ephemeral=false] - Whether the message should be ephemeral
     * @returns {{content: string, components: Array<ContainerBuilder | ActionRowBuilder>, flags: number}} Message object ready to send
     *
     * @example
     * ```typescript
     * const message = ComponentFactory.createV2Message(
     *     'Hello!',
     *     [container.build()],
     *     true // ephemeral
     * );
     *
     * await interaction.reply(message);
     * ```
     */
    public static createV2Message(
        content: string,
        components: (ContainerBuilder | ActionRowBuilder)[],
        ephemeral: boolean = false,
    ): {
        content: string;
        components: any[];
        flags: number;
    }
    {
        const flags = ephemeral
            ? (1 << 6) | (1 << 7) // Ephemeral + ComponentsV2
            : 1 << 7; // ComponentsV2

        return {
            content,
            components: components.map((c) => c.toJSON()),
            flags,
        };
    }
}
