/**
 * Constants for Discord.js v14 button types and styles.
 * Based on Discord API documentation for MessageComponent types and Button styles.
 * See: https://discord.com/developers/docs/interactions/message-components
 */

// Component Types

/** @deprecated will be removed soon in favour of buttonTypes */
export const COMPONENT_TYPE_BUTTON = 2;

/** @deprecated will be removed soon in favour of buttonStyles */
export const BUTTON_STYLE_PRIMARY = 1;
/** @deprecated will be removed soon in favour of buttonStyles */
export const BUTTON_STYLE_SECONDARY = 2;
/** @deprecated will be removed soon in favour of buttonStyles */
export const BUTTON_STYLE_SUCCESS = 3;
/** @deprecated will be removed soon in favour of buttonStyles */
export const BUTTON_STYLE_DANGER = 4;
/** @deprecated will be removed soon in favour of buttonStyles */
export const BUTTON_STYLE_LINK = 5;



/**
 * Enum-like object containing button component type constants.
 *
 * Based on Discord API documentation for MessageComponent types and Button styles.
 * See: https://discord.com/developers/docs/interactions/message-components
 * 
 * @namespace buttonTypes
 * @property {number} COMPONENT_TYPE_BUTTON - Numeric identifier for the standard button component type.
 */
export const buttonTypes = {
	COMPONENT_TYPE_BUTTON: 2,
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
	BUTTON_STYLE_LINK: 5, // Dark Grey with link (no custom_id)
}
