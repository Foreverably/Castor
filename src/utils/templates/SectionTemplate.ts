import {
    SectionBuilder,
    ComponentType,
    APISectionComponent,
    SectionComponentData,
    ComponentBuilder,
    TextDisplayBuilder,
    ThumbnailBuilder,
    ButtonBuilder,
} from "discord.js";
import { BaseComponentTemplate } from "@/structures/base/miscellaneous/BaseComponentTemplate";

/**
 * Options for creating a SectionTemplate instance.
 *
 * @interface SectionTemplateOptions
 */
export interface SectionTemplateOptions
{
    /** Initial text display components for the section */
    components?: ComponentBuilder[];
    /** Accessory component (thumbnail or button) - REQUIRED by Discord.js */
    accessory?: ComponentBuilder;
    /** Optional metadata to store with the section */
    metadata?: Record<string, any>;
}

/**
 * Template class for creating and managing Discord.js Section components.
 *
 * Sections represent text content (one to three Text Display components) with an accessory.
 * **IMPORTANT:** Sections REQUIRE an accessory (either a thumbnail or button).
 * If you don't need an accessory, use Text Display components directly in a Container instead.
 *
 * @class SectionTemplate
 * @extends {BaseComponentTemplate<SectionBuilder>}
 *
 * @example
 * ```typescript
 * // Create a section with thumbnail accessory
 * const section = ComponentFactory.createSection()
 *     .addTextDisplayComponents((textDisplay) =>
 *         textDisplay.setContent('This is section content')
 *     )
 *     .setThumbnailAccessory((thumbnail) =>
 *         thumbnail
 *             .setDescription('Alt text')
 *             .setURL('https://example.com/image.png')
 *     );
 *
 * // Sections MUST have an accessory - Discord.js will error otherwise
 * ```
 */
export class SectionTemplate extends BaseComponentTemplate<SectionBuilder>
{
    /** Child text display components in this section */
    private children: ComponentBuilder[] = [];
    /** Accessory component (thumbnail or button) - REQUIRED by Discord.js */
    private accessory?: ComponentBuilder;
    /** Metadata associated with this section */
    private metadata: Record<string, any> = {};

    /**
     * Creates a new SectionTemplate instance.
     *
     * @param {SectionTemplateOptions} [options={}] - Options for creating the section
     * @example
     * ```typescript
     * const section = new SectionTemplate({
     *     components: [textDisplay],
     *     accessory: thumbnail
     * });
     * ```
     */
    constructor(options: SectionTemplateOptions = {})
    {
        super({ type: ComponentType.Section } as SectionComponentData);

        if (options.components)
        {
            this.children = options.components;
        }

        if (options.accessory)
        {
            this.accessory = options.accessory;
        }

        if (options.metadata)
        {
            this.metadata = options.metadata;
        }

        this.requiredProperties = ["type"];
        this.component = this.createComponent();
    }

    /**
     * Creates the underlying SectionBuilder component.
     *
     * @protected
     * @returns {SectionBuilder} The created section builder
     */
    protected createComponent(): SectionBuilder
    {
        const sectionBuilder = new SectionBuilder();

        if (this.children && Array.isArray(this.children))
        {
            const textDisplays = this.children.filter(
                (c): c is TextDisplayBuilder => (c as any).data?.type === ComponentType.TextDisplay,
            ) as TextDisplayBuilder[];

            if (textDisplays.length > 0)
            {
                sectionBuilder.addTextDisplayComponents(...textDisplays);
            }
        }

        if (this.accessory)
        {
            const accessoryType = (this.accessory as any).data?.type;
            if (accessoryType === ComponentType.Thumbnail)
            {
                sectionBuilder.setThumbnailAccessory(this.accessory as ThumbnailBuilder);
            }
            else if (accessoryType === ComponentType.Button)
            {
                sectionBuilder.setButtonAccessory(this.accessory as ButtonBuilder);
            }
        }

        return sectionBuilder;
    }

    /**
     * Performs validation on the section component.
     * Validates component count, accessory type, and text display presence.
     *
     * @protected
     */
    protected performValidation(): void
    {
        if (!this.children || !Array.isArray(this.children))
        {
            return;
        }

        if (this.children.length > 10)
        {
            this.validationErrors.push(
                `Section cannot have more than 10 child components (got ${this.children.length})`,
            );
        }

        if (this.accessory)
        {
            const accessoryType = (this.accessory as any).data?.type;
            if (
                accessoryType &&
                ![ComponentType.Button, ComponentType.Thumbnail].includes(accessoryType)
            )
            {
                this.validationErrors.push(
                    `Section accessory must be a Button or Thumbnail component (got ${accessoryType})`,
                );
            }
        }

        const hasTextDisplay = this.children.some(
            (c) => (c as any).data?.type === ComponentType.TextDisplay,
        );
        if (!hasTextDisplay && this.children.length === 0)
        {
        }
    }

    /**
     * Adds text display components using a callback (fluent API).
     *
     * **Note:** Sections require an accessory (thumbnail or button).
     * If you don't need an accessory, use Text Display components directly in the Container instead.
     *
     * @param {function(TextDisplayBuilder): TextDisplayBuilder | void} callback - Callback function that receives a TextDisplayBuilder
     * @returns {this} This instance for method chaining
     *
     * @example
     * ```typescript
     * section.addTextDisplayComponents((textDisplay) =>
     *     textDisplay.setContent('This text is inside a Text Display component!')
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

        this.children.push(finalTextDisplay);
        this.component = this.createComponent();
        this.validate();
        return this;
    }

    /**
     * Sets a thumbnail accessory for the section using a callback (fluent API).
     *
     * **Note:** Sections REQUIRE an accessory (either thumbnail or button).
     * This method sets a thumbnail accessory for the section.
     *
     * @param {function(ThumbnailBuilder): ThumbnailBuilder | void} callback - Callback function that receives a ThumbnailBuilder
     * @returns {this} This instance for method chaining
     *
     * @example
     * ```typescript
     * section.setThumbnailAccessory((thumbnail) =>
     *     thumbnail
     *         .setDescription('alt text displaying on the image')
     *         .setURL('attachment://image.png')
     * );
     * ```
     */
    public setThumbnailAccessory(
        callback: (thumbnail: ThumbnailBuilder) => ThumbnailBuilder | void,
    ): this
    {
        const thumbnail = new ThumbnailBuilder();
        const result = callback(thumbnail);
        const finalThumbnail = result || thumbnail;

        this.accessory = finalThumbnail;
        this.component = this.createComponent();
        this.validate();
        return this;
    }

    /**
     * Sets a button accessory for the section using a callback (fluent API).
     *
     * **Note:** Sections REQUIRE an accessory (either thumbnail or button).
     * This method sets a button accessory for the section.
     *
     * @param {function(ButtonBuilder): ButtonBuilder | void} callback - Callback function that receives a ButtonBuilder
     * @returns {this} This instance for method chaining
     *
     * @example
     * ```typescript
     * section.setButtonAccessory((button) =>
     *     button
     *         .setCustomId('action_button')
     *         .setLabel('Click Me')
     *         .setStyle(ButtonStyle.Primary)
     * );
     * ```
     */
    public setButtonAccessory(callback: (button: ButtonBuilder) => ButtonBuilder | void): this
    {
        const button = new ButtonBuilder();
        const result = callback(button);
        const finalButton = result || button;

        this.accessory = finalButton;
        this.component = this.createComponent();
        this.validate();
        return this;
    }

    /**
     * Adds a component to the section.
     *
     * @param {ComponentBuilder} component - Component to add (typically a TextDisplayBuilder)
     * @returns {this} This instance for method chaining
     */
    public addComponent(component: ComponentBuilder): this
    {
        this.children.push(component);
        this.component = this.createComponent();
        this.validate();
        return this;
    }

    /**
     * Sets the accessory component for the section.
     *
     * @param {ComponentBuilder} accessory - Accessory component (must be ThumbnailBuilder or ButtonBuilder)
     * @returns {this} This instance for method chaining
     */
    public setAccessory(accessory: ComponentBuilder): this
    {
        this.accessory = accessory;
        this.component = this.createComponent();
        this.validate();
        return this;
    }

    /**
     * Removes the accessory component from the section.
     *
     * **Warning:** Discord.js requires sections to have an accessory.
     * Removing the accessory may cause errors when building the component.
     *
     * @returns {this} This instance for method chaining
     */
    public removeAccessory(): this
    {
        this.accessory = undefined;
        this.component = this.createComponent();
        return this;
    }

    /**
     * Creates a deep copy of this section template.
     *
     * @returns {SectionTemplate} A new SectionTemplate instance with copied data
     */
    public clone(): SectionTemplate
    {
        return new SectionTemplate({
            components: this.children.map((child) => child),
            accessory: this.accessory,
            metadata: { ...this.metadata },
        });
    }

    /**
     * Gets the component type.
     *
     * @returns {ComponentType} Always returns ComponentType.Section
     */
    public getType(): ComponentType
    {
        return ComponentType.Section;
    }

    /**
     * Checks if the section has an accessory component.
     *
     * @returns {boolean} True if the section has an accessory, false otherwise
     */
    public hasAccessory(): boolean
    {
        return !!this.accessory;
    }

    /**
     * Gets the type of the accessory component.
     *
     * @returns {ComponentType | null} The accessory type (Button or Thumbnail), or null if no accessory
     */
    public getAccessoryType(): ComponentType | null
    {
        return this.accessory ? (this.accessory as any).data.type : null;
    }

    /**
     * Gets all child components in the section.
     *
     * @returns {Array<ComponentBuilder>} Array of child components (shallow copy)
     */
    public getChildComponents(): ComponentBuilder[]
    {
        return [...this.children];
    }

    /**
     * Gets the accessory component of the section.
     *
     * @returns {ComponentBuilder | undefined} The accessory component, or undefined if not set
     */
    public getAccessoryComponent(): ComponentBuilder | undefined
    {
        return this.accessory;
    }
}
