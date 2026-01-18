import { SlashCommandBuilder } from "discord.js";
import { Flags } from "../../../plugins/flags/message.js";
import { addRpsGameData, getUniqueRpsId } from "../../../database/games/rps.js";
import { client } from "../../../../index.js";
import { basicEmbed } from "../../../plugins/msg/templates/embeds.js";
import createButtons from "../../../database/ui/buttons.js";
import { Precondition } from "../../../plugins/preconditions/precondition.js";

export const data = new SlashCommandBuilder()
	.setName("rps")
	.setDescription("Play a game of rock-paper-scissors!")
	.addUserOption(option =>
		option
			.setName("member")
			.setDescription("The user to play against (leave empty to play against the bot)")
	);

export async function execute(interaction)
{
	if (!Precondition.check.isVIPCID(interaction))
	{
		return Precondition.result.denied(interaction);
	}

	const selectedOpponent = interaction.options.getUser("member");

	const opponentId = selectedOpponent
		? (selectedOpponent.bot ? client.user.id : selectedOpponent.id)
		: client.user.id;

	const isAgainstBot = opponentId === client.user.id;

	if (opponentId === interaction.user.id)
	{
		return interaction.reply({
			content: "You cannot play against yourself!",
			flags: Flags.EPHEMERAL
		});
	}

	const rpsGames = client.games.get("rps") || {};

	const existingGame = Object.values(rpsGames).find(game =>
	{
		return (
			game?.opponent?.userId === interaction.user.id ||
			game?.challenger?.userId === interaction.user.id
		);
	});

	if (existingGame)
	{
		const otherPlayerId = existingGame.opponent?.userId === interaction.user.id
			? existingGame.challenger?.userId
			: existingGame.opponent?.userId;

		return interaction.reply({
			content: `You already have an ongoing game with <@${otherPlayerId}>. End that game before starting a new one!`,
			flags: Flags.EPHEMERAL
		});
	}

	const msg = isAgainstBot
		? `You've challenged **me** to rock-paper-scissors! 😏\n\nMake your choice, I'm ready to crush you.`
		: `<@${interaction.user.id}> has challenged <@${opponentId}> to rock-paper-scissors!\n\nWaiting for both players to make their move.`;

	const uniqueId = getUniqueRpsId(client);


	addRpsGameData(
		client,
		uniqueId,
		interaction.user.id,
		opponentId,
		isAgainstBot
	);

	return interaction.reply({
		embeds: [
			basicEmbed({
				author: { name: "Rock-Paper-Scissors" },
				description: msg,
				color: 16231462
			})
		],
		components: [
			createButtons([
				{ custom_id: `rps_r_${uniqueId}`, label: "Rock", style: 1 },
				{ custom_id: `rps_p_${uniqueId}`, label: "Paper", style: 1 },
				{ custom_id: `rps_s_${uniqueId}`, label: "Scissors", style: 1 }
			])
		]
	});
}