import {
    ContainerBuilder,
    ComponentType,
    APIContainerComponent,
    ContainerComponentData,
    ComponentBuilder as DiscordComponentBuilder,
    MessageFlags,
    SectionBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
} from "discord.js";
import { BaseComponentTemplate } from "@/structures/base/miscellaneous/BaseComponentTemplate";
import { SectionTemplate } from "./SectionTemplate";

/**
 * Options for creating a ContainerTemplate instance.
 *
 * @interface ContainerTemplateOptions
 */
export interface ContainerTemplateOptions
{
    /** Accent color for the container (hex color, e.g., 0x5865F2 for Discord blurple) */
    accentColor?: number;
    /** Whether the container should be marked as a spoiler */
    spoiler?: boolean;
    /** Initial components to add to the container (sections, text displays, etc.) */
    components?: (DiscordComponentBuilder | SectionBuilder | SectionTemplate)[];
    /** Optional metadata to store with the container */
    metadata?: Record<string, any>;
}

/**
 * Template class for creating and managing Discord.js Container components.
 *
 * Containers are the top-level component type in Discord's Components V2 system.
 * They can contain sections (which require accessories) and text display components.
 *
 * @class ContainerTemplate
 * @extends {BaseComponentTemplate<ContainerBuilder>}
 *
 * @example
 * ```typescript
 * // Create a container with fluent API
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
 *     )
 *     .addTextDisplayComponents((textDisplay) =>
 *         textDisplay.setContent('Additional content')
 *     );
 *
 * await interaction.reply({
 *     components: [container.build()],
 *     flags: MessageFlags.IsComponentsV2
 * });
 * ```
 */
export class ContainerTemplate extends BaseComponentTemplate<ContainerBuilder>
{
    /** Child components contained within this container */
    private children: (DiscordComponentBuilder | SectionBuilder | SectionTemplate)[] = [];
    /** Metadata associated with this container */
    private metadata: Record<string, any> = {};
    /** Internal container data structure */
    private containerData: Partial<ContainerComponentData>;
    /** Accent color for the container */
    private accentColor?: number;
    /** Whether the container is marked as a spoiler */
    private spoiler?: boolean;
    /** The underlying Discord.js ContainerBuilder instance */
    private containerBuilder: ContainerBuilder;

    /**
     * Creates a new ContainerTemplate instance.
     *
     * @param {ContainerTemplateOptions} [options={}] - Options for creating the container
     * @example
     * ```typescript
     * const container = new ContainerTemplate({
     *     accentColor: 0x5865F2,
     *     spoiler: false
     * });
     * ```
     */
    constructor(options: ContainerTemplateOptions = {})
    {
        super({ type: ComponentType.Container } as ContainerComponentData);

        this.containerBuilder = new ContainerBuilder();

        this.containerData = {
            type: ComponentType.Container,
            components: options.components?.map((c) => c.toJSON()) || [],
        };

        if (options.accentColor !== undefined)
        {
            this.accentColor = options.accentColor;
            this.containerBuilder.setAccentColor(options.accentColor);
        }

        if (options.spoiler !== undefined)
        {
            this.spoiler = options.spoiler;
            this.containerBuilder.setSpoiler(options.spoiler);
        }

        if (options.components)
        {
            this.children = options.components as (
                | DiscordComponentBuilder
                | SectionBuilder
                | SectionTemplate
            )[];
            this.addComponentsToBuilder(this.children);
        }

        if (options.metadata)
        {
            this.metadata = options.metadata;
        }

        this.requiredProperties = ["type"];
        this.component = this.createComponent();
    }

    /**
     * Creates the underlying ContainerBuilder component.
     *
     * @protected
     * @returns {ContainerBuilder} The created container builder
     */
    protected createComponent(): ContainerBuilder
    {
        return this.containerBuilder;
    }

    /**
     * Helper method to add components to the container builder.
     * Preserves all previous additions and adds new components to the existing builder.
     *
     * @private
     * @param {Array<DiscordComponentBuilder | SectionBuilder | SectionTemplate>} components - Components to add
     */
    private addComponentsToBuilder(
        components: (DiscordComponentBuilder | SectionBuilder | SectionTemplate)[],
    ): void
    {
        for (const child of components)
        {
            if (child instanceof SectionTemplate)
            {
                const builtSection = child.build();
                this.containerBuilder.addSectionComponents(() => builtSection);
            }
            else if (child instanceof SectionBuilder)
            {
                this.containerBuilder.addSectionComponents(() => child);
            }
            else
            {
                const childType = (child as any).data?.type;
                if (childType === ComponentType.TextDisplay)
                {
                    this.containerBuilder.addTextDisplayComponents(child as TextDisplayBuilder);
                }
                else if (childType === ComponentType.Section)
                {
                    this.containerBuilder.addSectionComponents(() => child as SectionBuilder);
                }
                else if (child instanceof SeparatorBuilder)
                {
                    this.containerBuilder.addSeparatorComponents(() => child);
                }
            }
        }
    }

    /**
     * Performs validation on the container component.
     * Validates accent color range, component count, and child component validity.
     *
     * @protected
     */
    protected performValidation(): void
    {
        if (!this.children || !Array.isArray(this.children))
        {
            return;
        }

        if (this.accentColor !== undefined)
        {
            const color = this.accentColor;
            if (color < 0x000000 || color > 0xffffff)
            {
                this.validationErrors.push(
                    `Accent color must be between 0x000000 and 0xFFFFFF (got ${color.toString(16)})`,
                );
            }
        }

        if (this.children.length > 50)
        {
            this.validationErrors.push(
                `Container cannot have more than 50 child components (got ${this.children.length})`,
            );
        }

        this.children.forEach((child, index) =>
        {
            if (!child)
            {
                this.validationErrors.push(`Child component at index ${index} is undefined`);
            }
        });
    }

    /**
     * Adds section components using a callback (fluent API).
     * Matches Discord.js guide pattern for building sections.
     * Can be called multiple times to add multiple sections.
     *
     * **IMPORTANT:** Sections REQUIRE an accessory (thumbnail or button).
     * If you don't need an accessory, use `addTextDisplayComponents()` directly on the container instead.
     *
     * @param {function(SectionBuilder): SectionBuilder | void} callback - Callback function that receives a SectionBuilder
     * @returns {this} This instance for method chaining
     *
     * @example
     * ```typescript
     * container.addSectionComponents((section) =>
     *     section
     *         .addTextDisplayComponents((textDisplay) =>
     *             textDisplay.setContent('Section content')
     *         )
     *         .setThumbnailAccessory((thumbnail) =>
     *             thumbnail.setURL('https://example.com/image.png')
     *         )
     * );
     * ```
     */
    public addSectionComponents(
        callback: (section: SectionBuilder) => SectionBuilder | void,
    ): this
    {
        const section = new SectionBuilder();
        const result = callback(section);
        const finalSection = result || section;

        this.containerBuilder.addSectionComponents(() => finalSection);
        this.children.push(finalSection);
        this.component = this.createComponent();
        this.validate();
        return this;
    }

    /**
     * Adds text display components directly to the container (fluent API).
     * This adds text displays directly to the container, not as a section.
     * Can be called multiple times to add multiple text displays.
     *
     * Use this when you don't need an accessory. If you need an accessory (thumbnail/button),
     * use `addSectionComponents()` instead to create a section with an accessory.
     *
     * @param {function(TextDisplayBuilder): TextDisplayBuilder | void} callback - Callback function that receives a TextDisplayBuilder
     * @returns {this} This instance for method chaining
     *
     * @example
     * ```typescript
     * container.addTextDisplayComponents((textDisplay) =>
     *     textDisplay.setContent('This is plain text content without an accessory')
     * );
     * ```
     */
    public addTextDisplayComponents(
        callback: (textDisplay: TextDisplayBuilder) => TextDisplayBuilder | void,
    ): this
    {
        const textDisplay = new TextDisplayBuilder();
        const result = callback(textDisplay);
        const finalTextDisplay = result || textDisplay;

        this.containerBuilder.addTextDisplayComponents(finalTextDisplay);
        this.children.push(finalTextDisplay);
        this.component = this.createComponent();
        this.validate();
        return this;
    }

    /**
     * Adds a child component to the container.
     * Supports SectionTemplate, SectionBuilder, or other component types.
     * Can be called multiple times to add multiple sections/components.
     *
     * @param {DiscordComponentBuilder | SectionBuilder | SectionTemplate} component - Component to add
     * @returns {this} This instance for method chaining
     *
     * @example
     * ```typescript
     * const section = ComponentFactory.createSection()
     *     .addTextDisplayComponents((textDisplay) => textDisplay.setContent('Content'))
     *     .setThumbnailAccessory((thumbnail) => thumbnail.setURL('...'));
     *
     * container.addComponent(section);
     * ```
     */
    public addComponent(
        component: DiscordComponentBuilder | SectionBuilder | SectionTemplate,
    ): this
    {
        this.children.push(component);
        this.addComponentsToBuilder([component]);
        this.component = this.createComponent();
        this.validate();
        return this;
    }

    /**
     * Adds multiple child components at once.
     *
     * @param {Array<DiscordComponentBuilder | SectionBuilder | SectionTemplate>} components - Array of components to add
     * @returns {this} This instance for method chaining
     *
     * @example
     * ```typescript
     * container.addComponents([section1, section2, textDisplay]);
     * ```
     */
    public addComponents(
        components: (DiscordComponentBuilder | SectionBuilder | SectionTemplate)[],
    ): this
    {
        this.children.push(...components);
        this.addComponentsToBuilder(components);
        this.component = this.createComponent();
        this.validate();
        return this;
    }

    /**
     * Removes a child component by its index.
     *
     * @param {number} index - Zero-based index of the component to remove
     * @returns {this} This instance for method chaining
     *
     * @example
     * ```typescript
     * container.removeComponent(0); // Removes the first component
     * ```
     */
    public removeComponent(index: number): this
    {
        if (index >= 0 && index < this.children.length)
        {
            this.children.splice(index, 1);
            this.component = this.createComponent();
            this.validate();
        }
        return this;
    }

    /**
     * Sets the accent color for the container (fluent API).
     *
     * @param {number} color - Hex color value (e.g., 0x5865F2 for Discord blurple)
     * @returns {this} This instance for method chaining
     * @throws {Error} If color is outside valid range (0x000000 - 0xFFFFFF)
     *
     * @example
     * ```typescript
     * container.setAccentColor(0x5865F2); // Discord blurple
     * container.setAccentColor(0x2ecc71); // Green
     * ```
     */
    public setAccentColor(color: number): this
    {
        this.accentColor = color;
        this.containerBuilder.setAccentColor(color);
        this.component = this.createComponent();
        this.validate();
        return this;
    }

    /**
     * Sets whether the container should be marked as a spoiler (fluent API).
     *
     * @param {boolean} spoiler - Whether the container is a spoiler
     * @returns {this} This instance for method chaining
     *
     * @example
     * ```typescript
     * container.setSpoiler(true); // Marks container as spoiler
     * ```
     */
    public setSpoiler(spoiler: boolean): this
    {
        this.spoiler = spoiler;
        this.containerBuilder.setSpoiler(spoiler);
        this.component = this.createComponent();
        return this;
    }

    /**
     * Sets a metadata value for the container.
     *
     * @param {string} key - Metadata key
     * @param {*} value - Metadata value
     * @returns {this} This instance for method chaining
     *
     * @example
     * ```typescript
     * container.setMetadata('category', 'help');
     * container.setMetadata('version', '1.0');
     * ```
     */
    public setMetadata(key: string, value: any): this
    {
        this.metadata[key] = value;
        return this;
    }

    /**
     * Gets a metadata value from the container.
     *
     * @param {string} key - Metadata key
     * @returns {*} The metadata value, or undefined if not found
     *
     * @example
     * ```typescript
     * const category = container.getMetadata('category');
     * ```
     */
    public getMetadata(key: string): any
    {
        return this.metadata[key];
    }

    /**
     * Gets all child components in the container.
     *
     * @returns {Array<DiscordComponentBuilder | SectionBuilder | SectionTemplate>} Array of child components (shallow copy)
     */
    public getComponents(): (DiscordComponentBuilder | SectionBuilder | SectionTemplate)[]
    {
        return [...this.children] as (DiscordComponentBuilder | SectionBuilder | SectionTemplate)[];
    }

    /**
     * Gets the number of child components in the container.
     *
     * @returns {number} Number of child components
     */
    public getComponentCount(): number
    {
        return this.children.length;
    }

    /**
     * Clears all child components from the container.
     * Preserves accent color and spoiler settings.
     *
     * @returns {this} This instance for method chaining
     *
     * @example
     * ```typescript
     * container.clearComponents(); // Removes all components but keeps accent color
     * ```
     */
    public clearComponents(): this
    {
        this.children = [];
        this.containerBuilder = new ContainerBuilder();
        if (this.accentColor !== undefined)
        {
            this.containerBuilder.setAccentColor(this.accentColor);
        }
        if (this.spoiler !== undefined)
        {
            this.containerBuilder.setSpoiler(this.spoiler);
        }
        this.component = this.createComponent();
        return this;
    }

    /**
     * Creates a section within the container.
     *
     * @deprecated Use `addSectionComponents()` with fluent API instead
     * @param {Array<DiscordComponentBuilder>} components - Components for the section
     * @param {DiscordComponentBuilder} [accessory] - Optional accessory for the section
     * @returns {this} This instance for method chaining
     */
    public createSection(
        components: DiscordComponentBuilder[],
        accessory?: DiscordComponentBuilder,
    ): this
    {
        return this;
    }

    /**
     * Creates a deep copy of this container template.
     *
     * @returns {ContainerTemplate} A new ContainerTemplate instance with copied data
     */
    public clone(): ContainerTemplate
    {
        return new ContainerTemplate({
            accentColor: this.accentColor,
            spoiler: this.spoiler,
            components: this.children.map((child) =>
            {
                return child;
            }) as (DiscordComponentBuilder | SectionBuilder | SectionTemplate)[],
            metadata: { ...this.metadata },
        });
    }

    /**
     * Gets the component type.
     *
     * @returns {ComponentType} Always returns ComponentType.Container
     */
    public getType(): ComponentType
    {
        return ComponentType.Container;
    }

    /**
     * Exports the container as a sendable message object.
     *
     * @param {MessageFlags} [flags] - Optional message flags (defaults to IsComponentsV2)
     * @returns {{components: ContainerBuilder[], flags?: MessageFlags}} Message object ready to send
     *
     * @example
     * ```typescript
     * const message = container.toMessageObject(MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral);
     * await interaction.reply(message);
     * ```
     */
    public toMessageObject(flags?: MessageFlags): {
        components: ContainerBuilder[];
        flags?: MessageFlags;
    }
    {
        return {
            components: [this.component],
            flags: flags || MessageFlags.IsComponentsV2,
        };
    }

    /**
     * Creates a ContainerTemplate from JSON data.
     *
     * @static
     * @param {APIContainerComponent} data - JSON data representing a container component
     * @returns {ContainerTemplate} A new ContainerTemplate instance
     *
     * @example
     * ```typescript
     * const container = ContainerTemplate.fromJSON(jsonData);
     * ```
     */
    public static fromJSON(data: APIContainerComponent): ContainerTemplate
    {
        const options: ContainerTemplateOptions = {
            accentColor: (data as any).style?.accent_color,
            spoiler: data.spoiler,
        };

        return new ContainerTemplate(options);
    }

    /**
     * Creates a themed container with predefined accent colors.
     *
     * @static
     * @param {'success' | 'warning' | 'error' | 'info' | 'primary'} theme - Theme name
     * @param {Array<DiscordComponentBuilder>} [components] - Optional initial components
     * @returns {ContainerTemplate} A new themed ContainerTemplate instance
     *
     * @example
     * ```typescript
     * const successContainer = ContainerTemplate.createThemed('success');
     * const errorContainer = ContainerTemplate.createThemed('error', [section1, section2]);
     * ```
     */
    public static createThemed(
        theme: "success" | "warning" | "error" | "info" | "primary",
        components?: DiscordComponentBuilder[],
    ): ContainerTemplate
    {
        const themeColors = {
            success: 0x2ecc71, // Green
            warning: 0xf39c12, // Orange
            error: 0xe74c3c, // Red
            info: 0x3498db, // Blue
            primary: 0x5865f2, // Discord blurple
        };

        return new ContainerTemplate({
            accentColor: themeColors[theme],
            components,
        });
    }
}
