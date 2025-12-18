import { SlashCommandBuilder } from "discord.js";
import { basicEmbed } from "../../../plugins/msg/templates/embeds.js";
import { Precondition } from "../../../plugins/preconditions/precondition.js";

export const data = new SlashCommandBuilder()
	.setName("slots")
	.setDescription("Play a game of slots!");


const slotItems = [ "🍇", "🍉", "🍊", "🍎", "🍓", "🍒" ];

export async function execute(interaction)
{

	if (!Precondition.check.isVIPCID(interaction))
	{
		return Precondition.result.denied(interaction);
	}

	let win = false;

	let slots = [];


	for (let i = 0; i < 3; i++)
	{
		slots[ i ] = [
			Math.floor(Math.random() * slotItems.length),
			Math.floor(Math.random() * slotItems.length),
			Math.floor(Math.random() * slotItems.length)
		];
	}

	const number = slots[ 1 ];

	if (number[ 0 ] === number[ 1 ] && number[ 1 ] == number[ 2 ])
	{
		win = true;
	}
	else if (
		number[ 0 ] === number[ 1 ] ||
		number[ 0 ] === number[ 2 ] ||
		number[ 1 ] === number[ 2 ]
	)
	{
		win = true;
	}

	if (win)
	{
		interaction.reply({
			embeds: [
				basicEmbed({
					author: { name: `🎰 Slots` },
					description: slots
						.map((s) => s.map((i) => slotItems[ i ]).join(" "))
						.join("\n")
				})
			]
		});
	}
	else
	{
		interaction.reply({
			embeds: [
				basicEmbed({
					author: { name: `🎰 Slots` },
					description: slots
						.map((s) => s.map((i) => slotItems[ i ]).join(" "))
						.join("\n"),
					color: 15158332
				})
			]
		});
	}
}