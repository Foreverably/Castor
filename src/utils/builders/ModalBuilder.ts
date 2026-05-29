export interface ModalComponentV2
{
    type: 18;
    label: string;
    description?: string;
    component: SelectMenuComponent | TextInputComponent;
}

export interface SelectMenuComponent
{
    type: 3; // String select
    custom_id: string;
    placeholder?: string;
    min_values?: number;
    max_values?: number;
    disabled?: boolean;
    options: SelectMenuOption[];
}

export interface SelectMenuOption
{
    label: string;
    value: string;
    description?: string;
    emoji?: { name: string; id?: string };
    default?: boolean;
}

export interface TextInputComponent
{
    type: 4; // Text input
    custom_id: string;
    style: 1 | 2;
    placeholder?: string;
    value?: string;
    required?: boolean;
    min_length?: number;
    max_length?: number;
}

export interface ModalOptionsV2
{
    title: string;
    custom_id: string;
    components: ModalComponentV2[];
}

/**
 * A utility class for constructing Discord modal interactions.
 * Provides static methods for creating various modal components and the modal itself.
 */
export class ModalBuilder
{
    /**
     * Creates a Components v2 modal component (type 18).
     * This component acts as a wrapper for other interactive components (text inputs, select menus)
     * within a modal.
     * @param options The label, optional description, and the component (TextInputComponent or SelectMenuComponent) itself.
     * @returns A ModalComponentV2 object.
     */
    static modalComponent(options: {
        label: string;
        description?: string;
        component: SelectMenuComponent | TextInputComponent;
    }): ModalComponentV2
    {
        return {
            type: 18,
            label: options.label,
            description: options.description,
            component: options.component,
        };
    }

    /**
     * Creates a text input component for Components v2 modals.
     * @param options The properties for the text input component.
     * @param options.customId A developer-defined unique identifier for the component.
     * @param options.style The style of the text input (1 for Short, 2 for Paragraph). Defaults to Short (1).
     * @param options.placeholder Custom placeholder text.
     * @param options.value A pre-filled value for the input.
     * @param options.required Whether the input is required. Defaults to true.
     * @param options.minLength Minimum number of characters allowed.
     * @param options.maxLength Maximum number of characters allowed.
     * @returns A TextInputComponent.
     */
    static textInput(options: {
        customId: string;
        style?: 1 | 2;
        placeholder?: string;
        value?: string;
        required?: boolean;
        minLength?: number;
        maxLength?: number;
    }): TextInputComponent
    {
        return {
            type: 4,
            custom_id: options.customId,
            style: options.style || 1,
            placeholder: options.placeholder,
            value: options.value,
            required: options.required !== false,
            min_length: options.minLength,
            max_length: options.maxLength,
        };
    }

    /**
     * Creates a string select menu component for Components v2 modals.
     * @param options The properties for the select menu component.
     * @param options.customId A developer-defined unique identifier for the component.
     * @param options.placeholder Custom placeholder text.
     * @param options.minValues Minimum number of options that must be chosen. Defaults to 1.
     * @param options.maxValues Maximum number of options that can be chosen. Defaults to 1.
     * @param options.disabled Whether the select menu is disabled. Defaults to false.
     * @param options.options An array of options for the select menu.
     * @returns A SelectMenuComponent.
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
            emoji?: string | { name: string; id?: string };
            default?: boolean;
        }>;
    }): SelectMenuComponent
    {
        const selectOptions: SelectMenuOption[] = options.options.map((opt) =>
        {
            let emoji: { name: string; id?: string } | undefined;
            if (opt.emoji)
            {
                if (typeof opt.emoji === "string")
                {
                    emoji = { name: opt.emoji };
                }
                else
                {
                    emoji = opt.emoji;
                }
            }

            return {
                label: opt.label,
                value: opt.value,
                description: opt.description,
                emoji: emoji,
                default: opt.default || false,
            };
        });

        return {
            type: 3,
            custom_id: options.customId,
            placeholder: options.placeholder,
            min_values: options.minValues,
            max_values: options.maxValues,
            disabled: options.disabled || false,
            options: selectOptions,
        };
    }

    /**
     * Creates a complete Components v2 modal structure directly using an options object.
     * For a fluent, chained approach, use `ModalBuilder.begin(title, customId)`.
     * @param options The title, custom ID, and an array of ModalComponentV2 for the modal.
     * @returns A ModalOptionsV2 object representing the complete modal.
     */
    static create(options: {
        title: string;
        customId: string;
        components: ModalComponentV2[];
    }): ModalOptionsV2
    {
        return {
            title: options.title,
            custom_id: options.customId,
            components: options.components,
        };
    }

    /**
     * Converts the ModalOptionsV2 object into the exact data structure expected by Discord's API
     * when responding to an interaction with a modal.
     * @param modalOptions The ModalOptionsV2 object to convert.
     * @returns A plain JavaScript object suitable for Discord API consumption.
     */
    static toAPIData(modalOptions: ModalOptionsV2): any
    {
        return {
            title: modalOptions.title,
            custom_id: modalOptions.custom_id,
            components: modalOptions.components,
        };
    }

    /**
     * Predefined modal configurations for common use cases.
     */
    static preset = {
        /**
         * Creates a bug report modal with a string select for bug type and a large text input for explanation.
         * @param customId The custom ID for the modal (defaults to 'mod_bug_report').
         * @returns A ModalOptionsV2 for a bug report form.
         */
        bugReport: (customId: string = "mod_bug_report"): ModalOptionsV2 =>
        {
            return ModalBuilder.begin("Modal with dropdown", customId)
                .addStringSelect("What's your favorite bug?", "bug_string_select", {
                    placeholder: "Choose your favorite bug...",
                    options: [
                        {
                            label: "Ant",
                            value: "ant",
                            description: "(best option)",
                            emoji: { name: "🐜" },
                        },
                        {
                            label: "Butterfly",
                            value: "butterfly",
                            emoji: { name: "🦋" },
                        },
                        {
                            label: "Caterpillar",
                            value: "caterpillar",
                            emoji: { name: "🐛" },
                        },
                    ],
                })
                .addTextInput("Why is it your favorite?", "bug_explanation", {
                    description: "Please provide as much detail as possible!",
                    style: 2, // Paragraph
                    placeholder: "Write your explanation here...",
                    required: true,
                    minLength: 1000,
                    maxLength: 4000,
                })
                .build();
        },

        /**
         * Creates a feedback modal with a rating select menu and a text area for comments.
         * @param customId The custom ID for the modal (defaults to 'mod_feedback').
         * @returns A ModalOptionsV2 for a feedback form.
         */
        feedback: (customId: string = "mod_feedback"): ModalOptionsV2 =>
        {
            return ModalBuilder.begin("Provide Feedback", customId)
                .addStringSelect("How would you rate your experience?", "feedback_rating", {
                    placeholder: "Select a rating...",
                    options: [
                        { label: "1 Star", value: "1", emoji: "⭐" },
                        { label: "2 Stars", value: "2", emoji: "⭐" },
                        { label: "3 Stars", value: "3", emoji: "⭐" },
                        { label: "4 Stars", value: "4", emoji: "⭐" },
                        { label: "5 Stars", value: "5", emoji: "⭐", default: true },
                    ],
                })
                .addTextInput("Additional comments", "feedback_text", {
                    style: 2, // Paragraph
                    placeholder: "Share your thoughts and suggestions...",
                    required: true,
                    minLength: 50,
                    maxLength: 1000,
                })
                .build();
        },

        /**
         * Creates a standard contact form modal with fields for name, email, and message.
         * @param customId The custom ID for the modal (defaults to 'mod_contact').
         * @returns A ModalOptionsV2 for a contact form.
         */
        contactForm: (customId: string = "mod_contact"): ModalOptionsV2 =>
        {
            return ModalBuilder.begin("Contact Us", customId)
                .addTextInput("Your Name", "contact_name", {
                    style: 1, // Short
                    placeholder: "Your name",
                    required: true,
                    maxLength: 100,
                })
                .addTextInput("Email Address", "contact_email", {
                    style: 1, // Short
                    placeholder: "your.email@example.com",
                    required: true,
                    maxLength: 255,
                })
                .addTextInput("Message", "contact_message", {
                    style: 2, // Paragraph
                    placeholder: "How can we help you?",
                    required: true,
                    minLength: 10,
                    maxLength: 2000,
                })
                .build();
        },
    };

    /**
     * Initializes a new modal constructor. Use this to construct modals with a chained API.
     * @param title The title of the modal.
     * @param customId A developer-defined unique identifier for the modal.
     * @returns A new ConstructModal instance.
     */
    static begin(title: string, customId: string): ConstructModal
    {
        return new ConstructModal(title, customId);
    }
}

/**
 * A basic representation of a Discord interaction that can be responded to with a modal.
 * This can be a `ChatInputCommandInteraction`, `ButtonInteraction`, etc., depending on
 * your Discord library. The key is that it must have `id`, `token`, and `client.rest`.
 */
interface DiscordInteractionWithClient
{
    id: string;
    token: string;
    client: {
        rest: {
            post: (
                path: string,
                options: { body: any },
            ) => Promise<{ status: number; statusText: string }>;
        };
    };
}

/**
 * @class ConstructModal
 * @description Provides a chained API for constructing Discord modals.
 *
 * Use `ModalBuilder.begin(title, customId)` to start building a modal
 * in a chained style.
 *
 * @example
 * ```ts
 * const customForm = ModalBuilder.begin('My Custom Form', 'mod_custom_form')
 *     .addTextInput('Your Name', 'user_name', { style: 1, required: true })
 *     .addStringSelect('Favorite Color', 'fav_color', {
 *         placeholder: 'Choose a color',
 *         options: [{ label: 'Red', value: 'red' }, { label: 'Blue', value: 'blue' }]
 *     })
 *     .build();
 *
 * console.log(JSON.stringify(customForm, null: 2));
 * ```
 */
class ConstructModal
{
    private _title: string;
    private _customId: string;
    private _components: ModalComponentV2[] = [];

    /**
     * @private
     * @param title The title of the modal.
     * @param customId A developer-defined unique identifier for the modal.
     * @description This constructor is intended to be called via `ModalBuilder.begin()`.
     */
    constructor(title: string, customId: string)
    {
        this._title = title;
        this._customId = customId;
    }

    /**
     * Adds a text input component to the modal.
     * @param label The label displayed above the text input.
     * @param customId A unique identifier for this text input within the modal.
     * @param options Additional options for the text input (style, placeholder, required, minLength, maxLength, etc.).
     * @returns The current ConstructModal instance for chaining.
     */
    addTextInput(
        label: string,
        customId: string,
        options?: {
            style?: 1 | 2;
            placeholder?: string;
            value?: string;
            required?: boolean;
            minLength?: number;
            maxLength?: number;
            description?: string;
        },
    ): ConstructModal
    {
        const textInputOptions: Omit<TextInputComponent, "type" | "custom_id"> = {
            style: options?.style || 1,
            placeholder: options?.placeholder,
            value: options?.value,
            required: options?.required,
            min_length: options?.minLength,
            max_length: options?.maxLength,
        };

        this._components.push(
            ModalBuilder.modalComponent({
                label: label,
                description: options?.description,
                component: ModalBuilder.textInput({ customId, ...textInputOptions }),
            }),
        );
        return this;
    }

    /**
     * Adds a string select menu component to the modal.
     * @param label The label displayed above the select menu.
     * @param customId A unique identifier for this select menu within the modal.
     * @param options Options for the select menu (placeholder, minValues, maxValues, options array, etc.).
     * @returns The current ConstructModal instance for chaining.
     */
    addStringSelect(
        label: string,
        customId: string,
        options: {
            placeholder?: string;
            minValues?: number;
            maxValues?: number;
            disabled?: boolean;
            options: Array<{
                label: string;
                value: string;
                description?: string;
                emoji?: string | { name: string; id?: string };
                default?: boolean;
            }>;
            description?: string;
        },
    ): ConstructModal
    {
        const selectMenuOptions: Omit<SelectMenuComponent, "type" | "custom_id"> = {
            placeholder: options.placeholder,
            min_values: options.minValues,
            max_values: options.maxValues,
            disabled: options.disabled,
            options: options.options as SelectMenuOption[],
        };

        this._components.push(
            ModalBuilder.modalComponent({
                label: label,
                description: options.description,
                component: ModalBuilder.stringSelect({ customId, ...selectMenuOptions }),
            }),
        );
        return this;
    }

    /**
     * Finalizes the build process and returns the complete ModalOptionsV2 object.
     * @returns The constructed ModalOptionsV2 object.
     */
    build(): ModalOptionsV2
    {
        return {
            title: this._title,
            custom_id: this._customId,
            components: this._components,
        };
    }
}
