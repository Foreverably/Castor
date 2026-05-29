export const SettingsKeys = {
    /**
     * Single channel where VIP commands can be used
     */
    vipChannel: "channel.vipchannel",
    /**
     * Single role in which users can be blacklisted via snowflake id
     */
    commandBlacklist: "role.commandblacklist",
    /**
     * Roles that are allowed to use restricted fun commands
     */
    allowedRestrictedFunCommandRoles: "roles.allowedRestrictedFunCommandRoles",
    /**
     * Role that is allowed to use staff only commands
     */
    staffRole: "roles.staffRole",
    /**
     * @deprecated No longer used, logging is handled by the logging service
     */
    internalLog: "channels.internalLog",
} as const;

export const SETTINGS_KEYS = Object.values(
    SettingsKeys,
) as readonly (typeof SettingsKeys)[keyof typeof SettingsKeys][];
