import { Error } from "../msg/templates/errors.js";
import { Flags } from "../flags/message.js";

/**
 * List of admin role IDs allowed to access elevated commands.
 * @constant
 * @type {string[]}
 */
const adminRoleIDs = [
	"820748705761329224", // NTTS
	"1221608852676677732", // Admins
	"1312570653026811924", // Bot Developers
	"1417983554104721419"
];

/**
 * Role ID representing staff members.
 * @constant
 * @type {string}
 */
const staffRoleID = "853315383213948938"; // staff

/**
 * Combined list of roles allowed to access fun commands.
 * Includes Staff and Admins by default.
 *
 * @constant
 * @type {string[]}
 */
const accessToFunCommandsRoleID = [
	"948567048705937470", // 125
	"1141526909004558378", // 150
	"1141527275389603910", // 200
	staffRoleID,
	...adminRoleIDs
];

/**
 * Channel ID representing the VIP channel.
 * Used to identify interactions occurring in the VIP channel.
 *
 * @constant
 * @type {string}
 */
const vipCID = "1304159479108993146";

/**
 * Checks whether the user has an admin role.
 *
 * @function isAdmin
 * @param {import("discord.js").ChatInputCommandInteraction} interaction - The interaction containing user data.
 * @returns {boolean} Whether the user has an admin role.
 */
function isAdmin(interaction)
{
	return interaction.member.roles.cache.some(role => adminRoleIDs.includes(role.id)) || interaction.member.permissions.has("Administrator");
}


/**
 * Checks whether the user is staff or an admin.
 *
 * @function isStaff
 * @param {import("discord.js").ChatInputCommandInteraction} interaction - The interaction containing user data.
 * @returns {boolean} Whether the user is staff or an admin.
 */
function isStaff(interaction)
{
	return isAdmin(interaction) || interaction.member.roles.cache.has(staffRoleID);
}

/**
 * Checks whether the user has permission to access fun commands.
 * Staff and Admins are automatically allowed.
 *
 * @function hasFunCommandAccess
 * @param {import("discord.js").ChatInputCommandInteraction} interaction - The interaction containing user data.
 * @returns {boolean} Whether the user has access to fun commands.
 */
function hasFunCommandAccess(interaction)
{
	return interaction.member.roles.cache.some(role => accessToFunCommandsRoleID.includes(role.id));
}


/**
 * Checks whether the interaction occurred in the VIP channel.
 *
 * @function isVIPCID
 * @param {import("discord.js").ChatInputCommandInteraction} interaction - The interaction containing channel data.
 * @returns {boolean} Whether the interaction's channel ID matches the VIP channel ID.
 */
function isVIPCID(interaction)
{
	return interaction.channelId === vipCID;
}

/**
 * Result handler for disabled or denied preconditions.
 * Sends a 403 Forbidden error response and returns false.
 *
 * @async
 * @function disabled
 * @param {import("discord.js").ChatInputCommandInteraction} interaction - The interaction to reply to.
 * @returns {Promise<boolean>} Always resolves to `false` to indicate failure.
 */
async function disabled(interaction)
{
	await interaction.reply({
		components: Error[ "403" ],
		flags: Flags.IS_COMPONENTS_V2 | Flags.EPHEMERAL
	});
	return false;
}

/**
 * Alias for {@link disabled}.
 *
 * @constant
 * @type {Function}
 */
const denied = disabled;

/**
 * Main export containing precondition checkers and result handlers.
 *
 * @namespace Precondition
 */
export const Precondition = {

	/**
	 * Collection of precondition checker functions.
	 *
	 * @namespace Precondition.check
	 * @property {Function} isAdmin - Checks whether the user has an admin role.
	 * @property {Function} isStaff - Checks whether the user is a staff member or an admin.
	 * @property {Function} hasFunCommandAccess - Checks whether the user has access to fun commands.
	 */
	check: {
		isAdmin,
		isStaff,
		hasFunCommandAccess,
		isVIPCID
	},

	/**
	 * Collection of precondition result handler functions.
	 *
	 * @namespace Precondition.result
	 * @property {Function} disabled - Handles a denied/disabled precondition by replying with a 403 error.
	 * @property {Function} denied - Alias of `disabled`.
	 */
	result: {
		disabled,
		denied
	}
};
