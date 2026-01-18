import { actions, objects } from "../../../database/actStorage.js";
import { SlashCommandBuilder } from "discord.js";
import { Flags } from "../../../plugins/flags/message.js";
import { Precondition } from "../../../plugins/preconditions/precondition.js";

function doAction(author, user)
{
	const action = actions[ Math.floor(Math.random() * actions.length) ];
	const object = objects[ Math.floor(Math.random() * objects.length) ];
	return `<@!${author}> ${action} <@!${user}> with ${object}!`;
}

export const data = new SlashCommandBuilder()
	.setName("act")
	.setDescription("Perform a fun action towards another user!")
	.addUserOption(option =>
		option
			.setName("user")
			.setDescription("The user to perform the action on")
			.setRequired(true)
	);


export async function execute(interaction)
{
	if (!Precondition.check.hasFunCommandAccess(interaction))
	{
		return Precondition.result.denied(interaction);
	}

	const targetUser = interaction.options.getUser("user");

	if (targetUser.id === interaction.user.id)
	{
		await interaction.reply({ content: "You cannot perform this action on yourself!", flags: Flags.EPHEMERAL });
		return;
	}

	const actionMessage = doAction(interaction.user.id, targetUser.id);
	await interaction.reply({
		content: actionMessage,
		allowedMentions: { parse: [] }
	});

}
