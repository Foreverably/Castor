import { CommandCategory } from "@/types/CommandCategories";

export const COMMAND_META = Symbol("commandMeta");

export interface CommandDecoratorConstraints
{
    staffOnly?: boolean;
    vipChannel?: boolean;
    restrictedFunCommands?: boolean;
}

export interface CommandDecoratorMetadata
{
    category?: CommandCategory;
    permissions?: string[];
    constraints?: CommandDecoratorConstraints;
}

function getMeta(target: any): CommandDecoratorMetadata
{
    if (!target[COMMAND_META])
    {
        target[COMMAND_META] = {};
    }
    return target[COMMAND_META];
}

export function Category(category: CommandCategory): ClassDecorator
{
    return (target) =>
    {
        getMeta(target).category = category;
    };
}

export function Permissions(...perms: string[]): ClassDecorator
{
    return (target) =>
    {
        getMeta(target).permissions = perms;
    };
}

export function StaffOnly(): ClassDecorator
{
    return (target) =>
    {
        const meta = getMeta(target);
        if (!meta.constraints) meta.constraints = {};
        meta.constraints.staffOnly = true;
    };
}

export function VipChannel(): ClassDecorator
{
    return (target) =>
    {
        const meta = getMeta(target);
        if (!meta.constraints) meta.constraints = {};
        meta.constraints.vipChannel = true;
    };
}

export function RestrictedFunCommands(): ClassDecorator
{
    return (target) =>
    {
        const meta = getMeta(target);
        if (!meta.constraints) meta.constraints = {};
        meta.constraints.restrictedFunCommands = true;
    };
}
