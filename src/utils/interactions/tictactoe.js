import { Flags } from "../../common/flags/message.js";
import { basicEmbed } from "../../common/msg/templates/embeds.js";
import { customAlphabet } from "nanoid";
import createButtons from "../buttons.js";

const nanoid = customAlphabet("1234567890abcdef", 10);
const winCombos = [
	[ "0", "1", "2" ],
	[ "3", "4", "5" ],
	[ "6", "7", "8" ],
	[ "0", "3", "6" ],
	[ "1", "4", "7" ],
	[ "2", "5", "8" ],
	[ "0", "4", "8" ],
	[ "2", "4", "6" ]
];

export async function handleTicTacToe(interaction, client)
{
	const [ , index, ...idParts ] = interaction.customId.split("_");
	const uniqueId = idParts.join("_");
	const games = client.games.get("tictactoe") || {};
	const game = games[ uniqueId ];

	if (!game)
	{
		return interaction.reply({
			content: "Game expired.",
			flags: Flags.EPHEMERAL
		});
	}
	if (interaction.user.id !== game.currentUser)
	{
		return interaction.reply({
			content: "Not your turn.",
			flags: Flags.EPHEMERAL
		});
	}

	const isChallenger = interaction.user.id === game.challenger.userId;
	const positions = isChallenger
		? game.challenger.positions
		: game.opponent.positions;

	if (
		game.challenger.positions.includes(index) ||
		game.opponent.positions.includes(index)
	)
	{
		return interaction.reply({ content: "Taken.", flags: Flags.EPHEMERAL });
	}

	positions.push(index);
	game.currentUser = isChallenger
		? game.opponent.userId
		: game.challenger.userId;

	if (game.currentUser === client.user.id && game.isBot)
	{
		const available = [ "0", "1", "2", "3", "4", "5", "6", "7", "8" ].filter(i =>
			!game.challenger.positions.includes(i) && !game.opponent.positions.includes(i)
		);
		if (available.length > 0)
		{
			const botIndex = available[ Math.floor(Math.random() * available.length) ];
			game.opponent.positions.push(botIndex);
			game.currentUser = game.challenger.userId;
		}
	}

	const hasWon = (p) => winCombos.some((c) => c.every((i) => p.includes(i)));
	const checkResult = () =>
	{
		if (hasWon(game.challenger.positions))
		{
			return { winner: game.challenger.userId };
		}
		if (hasWon(game.opponent.positions))
		{
			return { winner: game.opponent.userId };
		}
		if (game.challenger.positions.length + game.opponent.positions.length >= 9)
		{
			return { draw: true };
		}
		return null;
	};

	const result = checkResult();

	if (result)
	{
		const boardStr = getBoardString(game.challenger.positions, game.opponent.positions);
		delete games[ uniqueId ];
		const text = result.draw ? "Draw!" : `<@${result.winner}> wins!`;
		return interaction.update({
			embeds: [
				basicEmbed({
					author: { name: "TicTacToe" },
					description: `${text}\n\n${boardStr}`,
					color: 16231462
				})
			],
			components: getTicTacToeButtons(
				[ "0", "1", "2", "3", "4", "5", "6", "7", "8" ],
				uniqueId
			)
		});
	}

	await interaction.update({
		embeds: [
			basicEmbed({
				author: { name: "TicTacToe" },
				description: `Next turn: <@${game.currentUser}>\n\n${getBoardString(game.challenger.positions, game.opponent.positions)}`,
				color: 16231462
			})
		],
		components: getTicTacToeButtons(
			[ ...game.challenger.positions, ...game.opponent.positions ],
			uniqueId
		)
	});
}

export function getTicTacToeButtons(filledSlots, uniqueId)
{
	return [
		createButtons([
			{
				custom_id: `ttt_0_${uniqueId}`,
				label: "1",
				style: 1,
				disabled: filledSlots.includes("0")
			},
			{
				custom_id: `ttt_1_${uniqueId}`,
				label: "2",
				style: 1,
				disabled: filledSlots.includes("1")
			},
			{
				custom_id: `ttt_2_${uniqueId}`,
				label: "3",
				style: 1,
				disabled: filledSlots.includes("2")
			}
		]),
		createButtons([
			{
				custom_id: `ttt_3_${uniqueId}`,
				label: "4",
				style: 1,
				disabled: filledSlots.includes("3")
			},
			{
				custom_id: `ttt_4_${uniqueId}`,
				label: "5",
				style: 1,
				disabled: filledSlots.includes("4")
			},
			{
				custom_id: `ttt_5_${uniqueId}`,
				label: "6",
				style: 1,
				disabled: filledSlots.includes("5")
			}
		]),
		createButtons([
			{
				custom_id: `ttt_6_${uniqueId}`,
				label: "7",
				style: 1,
				disabled: filledSlots.includes("6")
			},
			{
				custom_id: `ttt_7_${uniqueId}`,
				label: "8",
				style: 1,
				disabled: filledSlots.includes("7")
			},
			{
				custom_id: `ttt_8_${uniqueId}`,
				label: "9",
				style: 1,
				disabled: filledSlots.includes("8")
			}
		])
	];
}

export function getUniqueTicTacToeId(client)
{
	const rpsGames = client.games.get("tictactoe") || {};
	let uniqueId = nanoid();
	while (rpsGames[ uniqueId ])
	{
		uniqueId = nanoid();
	}

	return uniqueId;
};

export function addTicTacToeGameData(
	client,
	uniqueId,
	userId,
	opponentId,
	isBot = false
)
{
	client.games.set("tictactoe", {
		...client.games.get("tictactoe"),
		[ uniqueId ]: {
			challenger: { userId, positions: [] },
			opponent: { userId: opponentId, positions: [] },
			currentUser: userId,
			uniqueId,
			isBot
		}
	});
};

export const getBoardString = (challengerPositions, opponentPositions) =>
{
	const board = Array(9).fill("⬜");
	challengerPositions.forEach(i => board[ parseInt(i) ] = "❌");
	opponentPositions.forEach(i => board[ parseInt(i) ] = "⭕");
	return `${board.slice(0,3).join(" ")}\n${board.slice(3,6).join(" ")}\n${board.slice(6,9).join(" ")}`;
};
