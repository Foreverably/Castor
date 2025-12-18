import { SlashCommandBuilder } from "discord.js";
import { basicEmbed } from "../../../plugins/msg/templates/embeds.js";
import { fetchGuildLeaderboard } from "../../../database/queries.js";
import { Flags } from "../../../plugins/flags/message.js";
import { Precondition } from "../../../plugins/preconditions/precondition.js";

export const data = new SlashCommandBuilder()
	.setName("leaderboard")
	.setDescription("Show the leaderboard.");

export async function execute(interaction)
{

	if (!Precondition.check.isVIPCID(interaction))
	{
		return Precondition.result.denied(interaction);
	}

	try
	{
		const users = await fetchGuildLeaderboard();

		if (users.length === 0)
		{
			return interaction.reply({
				content: "There are no users in the leaderboard.",
				flags: Flags.EPHEMERAL
			});
		}

		const text = users
			.map(
				(user, index) =>
					`**#${index + 1}** <@${user.userId}> - ${user.balance} coins`
			)
			.join("\n\n");

		return interaction.reply({
			embeds: [
				basicEmbed({
					author: { name: "🏆 Leaderboard" },
					description: text,
					footer: { text: "Use /search to get some coins!" }
				})
			]
		});
	}
	catch (error)
	{
		console.log(interaction.user.id, error);
	}
}