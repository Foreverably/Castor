import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { pingComponent } from "../../../../plugins/msg/templates/components.js";
import { Precondition } from "../../../../plugins/preconditions/precondition.js";
import { Flags } from "../../../../plugins/flags/message.js";


export const data = new SlashCommandBuilder()
	.setName("ping")
	.setDescription("Replies with Pong!");

export async function execute(interaction)
{
	if (!Precondition.check.isAdmin(interaction))
	{
		return Precondition.result.denied(interaction);
	}

	await interaction.reply({
		content: "",
		components: pingComponent(interaction),
		flags: Flags.IS_COMPONENTS_V2 | Flags.EPHEMERAL
	});
}