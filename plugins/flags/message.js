import { MessageFlags } from "discord.js";

/**
 * Helper object containing message flags for Discord messages. Maps to Discord.js MessageFlags.
 *
 * @property {number} EPHEMERAL - Flag indicating the message is ephemeral (temporary)
 * @property {number} TEMPORARY - Alias for EPHEMERAL
 * @property {number} IS_COMPONENTS_V2 - Flag indicating the message uses Components V2
 * @property {number} CV2 - Alias for IS_COMPONENTS_V2
 *
 * @enum {number}
 */
export const Flags = {
	EPHEMERAL: MessageFlags.Ephemeral,
	TEMPORARY: MessageFlags.Ephemeral,
	IS_COMPONENTS_V2: MessageFlags.IsComponentsV2,
	CV2: MessageFlags.IsComponentsV2
};