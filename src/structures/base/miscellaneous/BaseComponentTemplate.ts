import {
    ComponentBuilder,
    ComponentType,
    MessageFlags,
    APIMessageComponent,
    ComponentData,
    AnyAPIActionRowComponent,
} from "discord.js";

/**
 * Abstract base class for all component templates
 */
export abstract class BaseComponentTemplate<T extends ComponentBuilder>
{
    protected component: T;
    protected validationErrors: string[] = [];
    protected requiredProperties: string[] = [];

    constructor(protected data: Partial<ComponentData>)
    {
        this.component = this.createComponent();
        this.validate();
    }

    protected abstract createComponent(): T;

    protected validate(): void
    {
        this.validationErrors = [];

        for (const prop of this.requiredProperties)
        {
            if (!this.data[prop as keyof ComponentData])
            {
                this.validationErrors.push(`Missing required property: ${prop}`);
            }
        }

        this.performValidation();
    }

    protected abstract performValidation(): void;

    public build(): T
    {
        if (this.validationErrors.length > 0)
        {
            throw new Error(`Component validation failed:\n${this.validationErrors.join("\n")}`);
        }
        return this.component;
    }

    public toJSON(): AnyAPIActionRowComponent
    {
        return this.component.toJSON();
    }

    public isValid(): boolean
    {
        return this.validationErrors.length === 0;
    }

    public getValidationErrors(): string[]
    {
        return [...this.validationErrors];
    }

    public abstract clone(): BaseComponentTemplate<T>;

    public abstract getType(): ComponentType;
}
