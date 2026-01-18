/**
 * Constants for Discord.js v14 button types and styles.
 * Based on Discord API documentation for MessageComponent types and Button styles.
 * See: https://discord.com/developers/docs/interactions/message-components
 */


/**
 * Enum object containing button component type constants.
 *
 * Based on Discord API documentation for MessageComponent types and Button styles.
 * See: https://discord.com/developers/docs/interactions/message-components
 *
 * @namespace buttonTypes
 * @property {number} COMPONENT_TYPE_BUTTON - Numeric identifier for the standard button component type.
 * @type {{COMPONENT_TYPE_BUTTON: number}}
 */
export const buttonTypes = {
	COMPONENT_TYPE_BUTTON: 2
};

/**
 * Based on Discord API documentation for MessageComponent types and Button styles.
 * See: https://discord.com/developers/docs/interactions/message-components
 *
 * @namespace buttonStyles
 * @property {number} BUTTON_STYLE_PRIMARY - Primary button style (value: 1)
 * @property {number} BUTTON_STYLE_SECONDARY - Secondary button style (value: 2)
 * @property {number} BUTTON_STYLE_SUCCESS - Success button style (value: 3)
 * @property {number} BUTTON_STYLE_DANGER - Danger button style (value: 4)
 * @property {number} BUTTON_STYLE_LINK - Link button style (value: 5)
 */
export const buttonStyles = {
	BUTTON_STYLE_PRIMARY: 1, // Blurple
	BUTTON_STYLE_SECONDARY: 2, // Grey
	BUTTON_STYLE_SUCCESS: 3, // Green
	BUTTON_STYLE_DANGER: 4, // Red
	BUTTON_STYLE_LINK: 5 // Dark Grey with link
};

