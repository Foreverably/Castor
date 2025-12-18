import { SlashCommandBuilder } from "discord.js";
import { basicEmbed } from "../../../plugins/msg/templates/embeds.js";
import { Precondition } from "../../../plugins/preconditions/precondition.js";

export const data = new SlashCommandBuilder()
	.setName("8ball")
	.setDescription("Ask the magic 8ball a question!")
	.addStringOption(option =>
		option
			.setName("question")
			.setDescription("The question you want to ask the magic 8ball")
			.setRequired(true)
	);

const replies = [
	"Maybe.",
	"Certainly not.",
	"I hope so.",
	"Not in your wildest dreams.",
	"There is a good chance.",
	"Quite likely.",
	"I think so.",
	"I hope not.",
	"I hope so.",
	"Never!",
	"Pfft.",
	"Sorry, bucko.",
	"Hell, yes.",
	"Hell to the no.",
	"The future is bleak.",
	"The future is uncertain.",
	"I would rather not say.",
	"Who cares?",
	"Possibly.",
	"Never, ever, ever.",
	"There is a small chance.",
	"Yes!",
	"lol no.",
	"There is a high probability.",
	"What difference does it makes?",
	"Not my problem.",
	"Ask someone else."
];

export async function execute(interaction)
{

	if (!Precondition.check.isVIPCID(interaction))
	{
		return Precondition.result.denied(interaction);
	}

	try
	{
		const results = replies[ Math.floor(Math.random() * replies.length) ];
		const question = interaction.options.getString("question");

		interaction.reply({
			embeds: [
				basicEmbed({
					author: {
						name: "🎱 8ball"
					},
					fields: [
						{ name: "Question", value: question },
						{ name: "Answer", value: results }
					]
				})
			]
		});
	}
	catch (error)
	{
		console.log(interaction.user.id, error);
	}
}