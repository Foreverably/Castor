import { SlashCommandBuilder } from "discord.js";
import { basicEmbed } from "../../../plugins/msg/templates/embeds.js";
import { Precondition } from "../../../plugins/preconditions/precondition.js";

export const data = new SlashCommandBuilder()
	.setName("coinflip")
	.setDescription("Flip a coin and guess the side!")
	.addStringOption(option => option
		.setName("side")
		.setDescription("The side you want to guess")
		.addChoices(
			{ name: "Heads", value: "heads" },
			{ name: "Tails", value: "tails" }
		)
		.setRequired(true)
	);

export async function execute(interaction)
{

	if (!Precondition.check.isVIPCID(interaction))
	{
		return Precondition.result.denied(interaction);
	}

	const n = Math.floor(Math.random() * 2) === 0 ? "heads" : "tails";

	const guess = interaction.options.getString("side");
	const result =
		guess === n
			? {
				author: { name: `🪙 Coinflip` },
				color: 0x00ff00,
				description: `You guessed **${guess}** and the coin landed on **${n}**. You win!`
			}
			: {
				author: { name: `🪙 Coinflip` },
				color: 0xff0000,
				description: `You guessed **${guess}** and the coin landed on **${n}**. You lose!`
			};

	return interaction.reply({
		embeds: [ basicEmbed(result) ]
	});
}