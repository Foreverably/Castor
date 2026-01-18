import { SlashCommandBuilder } from "discord.js";
import { Flags } from "../../plugins/flags/message.js";

// mr stark? Is this really coming soon?

export const data = new SlashCommandBuilder()
	.setName("help")
	.setDescription("Need help with something? Use this command for help!")
	.addStringOption(option =>
		option
			.setName("page")
			.setDescription("The page to view help for")
			.setRequired(false)
			.addChoices(
				{ name: "Information", value: "info" },
				{ name: "Commands", value: "cmds" },
				{ name: "Make it a Quote", value: "quoter" }
			));

export async function execute(interaction)
{
	const page = interaction.options.getString("page") || "info";

	interaction.reply({
		content: `-# coming soon`,
		flags: Flags.EPHEMERAL
	});
}
