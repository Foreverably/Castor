import { ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize, TextDisplayBuilder } from "discord.js";

/**
 * Generates a component layout representing a **404 Not Found** error message.
 *
 * @function notFoundError
 * @returns {ContainerBuilder[]} An array containing a single ContainerBuilder instance
 * representing the formatted 404 error message.
 */
function notFoundError()
{
	const components = [
		new ContainerBuilder()
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent("-# ENOTFOUND — 404")
			)
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent("## 404 Not Found")
			)
			.addSeparatorComponents(
				new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
			)
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent("The requested content couldn't be found. It may have been removed, doesn't exist, or is restricted from your access.")
			)
	];
	return components;
}

/**
 * Generates a component layout representing a 403 Forbidden error message.
 *
 * @function forbiddenError
 * @returns {ContainerBuilder[]} An array containing a single ContainerBuilder instance
 * representing the formatted 403 error message.
 */
function forbiddenError()
{
	const components = [
		new ContainerBuilder()
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent("-# FORBIDDEN — 403")
			)
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent("## 403 Forbidden")
			)
			.addSeparatorComponents(
				new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
			)
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent("The requested content is restricted and cannot be accessed with your current permissions.")
			)
	];
	return components;
}

/**
 * A mapped collection of reusable error component layouts.
 *
 * @constant
 * @type {{404: ContainerBuilder[], 403: ContainerBuilder[]}}
 * @property {ContainerBuilder[]} 404 - A prebuilt component set for a 404 Not Found error.
 * @property {ContainerBuilder[]} 403 - A prebuilt component set for a 403 Forbidden error.
 */
export const Error = {
	404: notFoundError(),
	403: forbiddenError()
};
