export enum SettingKey
{
    StaffRoles = "staff_roles",
    VipChannel = "vip_channel",
    CommandBlacklist = "command_blacklist",
    RestrictedFunCommandRoles = "restricted_fun_command_roles",
    InternalLogChannel = "internal_log_channel",
}

export const DEPRECATED_KEYS: SettingKey[] = [
    SettingKey.InternalLogChannel,
];

export const SETTING_LABELS: Record<SettingKey, string> = {
    [SettingKey.StaffRoles]: "Staff Roles",
    [SettingKey.VipChannel]: "VIP Channel",
    [SettingKey.CommandBlacklist]: "Command Blacklist",
    [SettingKey.RestrictedFunCommandRoles]: "Restricted Fun Command Roles",
    [SettingKey.InternalLogChannel]: "Internal Log Channel",
};

export const BOOLEAN_KEYS: SettingKey[] = [];

export const CHANNEL_KEYS: SettingKey[] = [
    SettingKey.VipChannel,
    SettingKey.InternalLogChannel,
];

export const SINGLE_ROLE_KEYS: SettingKey[] = [
    SettingKey.CommandBlacklist,
];

export const ROLE_ARRAY_KEYS: SettingKey[] = [
    SettingKey.StaffRoles,
    SettingKey.RestrictedFunCommandRoles,
];

export interface SettingsModule
{
    label: string;
    emoji: string;
    description: string;
    keys: SettingKey[];
}

export const MODULES: Record<string, SettingsModule> = {
    permissions: {
        label: "Permissions",
        emoji: "🔒",
        description: "Staff roles, restricted fun command roles, and blacklist",
        keys: [
            SettingKey.StaffRoles,
            SettingKey.RestrictedFunCommandRoles,
            SettingKey.CommandBlacklist,
        ],
    },
    channels: {
        label: "Channels",
        emoji: "📺",
        description: "VIP channel",
        keys: [
            SettingKey.VipChannel,
        ],
    },
};

export function getSettingLabel(key: SettingKey): string
{
    return SETTING_LABELS[key];
}
