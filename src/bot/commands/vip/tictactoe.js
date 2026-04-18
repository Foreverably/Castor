import { SlashCommandBuilder } from "discord.js";
import {
	addTicTacToeGameData,
	getTicTacToeButtons,
	getUniqueTicTacToeId,
	getBoardString
} from "../../../utils/interactions/tictactoe.js";
import { Flags } from "../../../common/flags/message.js";
import { basicEmbed } from "../../../common/msg/templates/embeds.js";
import { client } from "../../../../index.js";
import { Category } from "../../../common/command/enums.js";

/** @type {import("../../../common/schema.js").CommandData} */
export const data = {
	name: "tictactoe",
	category: Category.VIP,
	description: "Play a game of tic-tac-toe against another user!",
	constraints: {
		isVIP: false,
		hasDevelopmentRole: true
	},
	options: new SlashCommandBuilder()
		.addUserOption((option) =>
			option
				.setName("member")
				.setDescription("The user to play against (leave empty to play against the bot)")
				.setRequired(false)
		),
	execute(interaction)
	{
		const selectedOpponent = interaction.options.getUser("member");

		const opponentId = selectedOpponent
			? (selectedOpponent.bot ? client.user.id : selectedOpponent.id)
			: client.user.id;

		const isBot = opponentId === client.user.id;

		if (!isBot && opponentId === interaction.user.id)
		{
			return interaction.reply({
				content: "You cannot play against yourself!",
				flags: Flags.EPHEMERAL
			});
		}

		const tictactoeGames = client.games.get("tictactoe") || {};
		const existingGame = Object.values(tictactoeGames).find(
			(game = {}) =>
				game.opponent?.userId === interaction.user.id ||
				game.challenger?.userId === interaction.user.id
		);

		if (existingGame)
		{
			const otherId = existingGame.opponent?.userId === interaction.user.id
				? existingGame.challenger?.userId
				: existingGame.opponent?.userId;

			return interaction.reply({
				content: `You already have a game with <@${otherId}>. End that game before starting a new one!`,
				flags: Flags.EPHEMERAL
			});
		}

		const uniqueId = getUniqueTicTacToeId(client);
		addTicTacToeGameData(client, uniqueId, interaction.user.id, opponentId, isBot);

		const opponentMention = isBot ? "the bot" : `<@${opponentId}>`;

		return interaction.reply({
			embeds: [
				basicEmbed({
					author: { name: "TicTacToe" },
					description: `The ultimate game of TicTacToe between <@${interaction.user.id}> and ${opponentMention}.\n\nWaiting for <@${interaction.user.id}> to choose\n\n${getBoardString([], [])}`,
					color: 16231462
				})
			],
			components: getTicTacToeButtons([], uniqueId)
		});
	}
};
