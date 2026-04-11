/**
 * @typedef {Object} CommandConstraints
 * @property {boolean} [isVIP] - Access restricted to VIP channel.
 * @property {boolean} [hasFunCommands] - Access restricted to fun command roles.
 * @property {boolean} [isStaff] - Access restricted to staff members.
 * @property {boolean} [isSrMod] - Access restricted to senior moderators.
 * @property {boolean} [isAdmin] - Access restricted to administrators.
 * @property {boolean} [hasDevelopmentRole] - Access restricted to development roles.
 */

/**
 * @typedef {Object} CommandData
 * @property {string} name - The name of the slash command.
 * @property {string} description - The description of the slash command.
 * @property {number} category - The category of the slash command.
 * @property {import("discord.js").SlashCommandBuilder} options - The command builder instance.
 * @property {CommandConstraints} [constraints] - Precondition requirements.
 * @property {(interaction: import("discord.js").ChatInputCommandInteraction) => Promise<void> | void} execute - The execution logic.
 */

export const Schema = {};