/**
 * Attaches interaction handlers to the client.
 * Expects command modules loaded via loadCommandsFromDir to export `data` and `execute(interaction)`.
 */
import path from "path";
import { loadCommandsFromDir } from "./loadCommands.js";
import { Flags } from "../../../plugins/flags/message.js";
import { getTicTacToeButtons } from "../../../tools/commands/tictactoe.js";
import { basicEmbed } from "../../../plugins/msg/templates/embeds.js";

function handleInteractionError(interaction)
{
	try
	{
		if (interaction.deferred || interaction.replied)
		{
			return interaction.followUp({
				content: "There was an error while executing this command.",
				flags: Flags.EPHEMERAL
			});
		}

		return interaction.reply({
			content: "There was an error while executing this command.",
			flags: Flags.EPHEMERAL
		});
	}
	catch
	{
	}
}

export default async function handleInteractions({ client })
{
	const commandsDir = path.join(process.cwd(), "bot", "commands");
	const { commands } = await loadCommandsFromDir(commandsDir);

	client.commands = client.commands ?? new Map();
	for (const c of commands)
	{
		const name = c.data.name ?? c.data.toJSON?.().name;
		if (!name) continue;
		client.commands.set(name, c.module);
	}

	client.on("interactionCreate", async (interaction) =>
	{
		if (interaction.isChatInputCommand())
		{
			const cmd = client.commands.get(interaction.commandName);
			if (!cmd) return;

			try
			{
				await cmd.execute(interaction);
			}
			catch (err)
			{
				console.error(`Error executing slash ${interaction.commandName}:`, err);
				handleInteractionError(interaction);
			}
			return;
		}

		if (interaction.isMessageContextMenuCommand())
		{
			const cmd = client.commands.get(interaction.commandName);
			if (!cmd)
			{
				console.warn(`No module found for context menu command ${interaction.commandName}`);
				return;
			}

			try
			{
				await cmd.execute(interaction);
			}
			catch (err)
			{
				console.error(`Error executing context menu ${interaction.commandName}:`, err);
				handleInteractionError(interaction);
			}
			return;
		}


		if (interaction.isMessageComponent && interaction.isMessageComponent())
		{
			try
			{
				const customId = interaction.customId;
				if (!customId) return;

				if (customId.startsWith("ttt_"))
				{
					const parts = customId.split("_");
					const index = parts[ 1 ];
					const uniqueId = parts.slice(2).join("_");
					const tttGames = client.games.get("tictactoe") || {};
					const game = tttGames[ uniqueId ];
					if (!game)
					{
						return interaction.reply({ content: "Game not found or has expired.", flags: Flags.EPHEMERAL });
					}

					const userId = interaction.user.id;
					if (userId !== game.currentUser)
					{
						return interaction.reply({ content: "It's not your turn.", flags: Flags.EPHEMERAL });
					}

					if (game.challenger.positions.includes(index) || game.opponent.positions.includes(index))
					{
						return interaction.reply({ content: "This slot is already taken.", flags: Flags.EPHEMERAL });
					}

					const isChallenger = userId === game.challenger.userId;
					if (isChallenger)
					{
						game.challenger.positions.push(index);
					}
					else
					{
						game.opponent.positions.push(index);
					}

					const otherId = isChallenger ? game.opponent.userId : game.challenger.userId;
					game.currentUser = otherId;

					const buildBoard = () =>
					{
						const symbols = Array.from({ length: 9 }, (_, i) =>
						{
							if (game.challenger.positions.includes(String(i))) return "❌";
							if (game.opponent.positions.includes(String(i))) return "⭕";
							return "⬜";
						});
						return `${symbols[ 0 ]} ${symbols[ 1 ]} ${symbols[ 2 ]}\n${symbols[ 3 ]} ${symbols[ 4 ]} ${symbols[ 5 ]}\n${symbols[ 6 ]} ${symbols[ 7 ]} ${symbols[ 8 ]}`;
					};

					const filledSlots = [ ...game.challenger.positions, ...game.opponent.positions ];

					if (game.isBot && game.currentUser !== interaction.user.id)
					{
						await interaction.update({
							embeds: [
								basicEmbed({
									author: { name: "TicTacToe" },
									description: `I'm thinking... 🤔\n\n${buildBoard()}`,
									color: 16231462
								})
							],
							components: getTicTacToeButtons(filledSlots, uniqueId)
						});

						await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 seconds

						const allSlots = Array.from({ length: 9 }, (_, i) => String(i));
						const taken = [ ...game.challenger.positions, ...game.opponent.positions ];
						const available = allSlots.filter(s => !taken.includes(s));
						if (available.length > 0)
						{
							const pick = available[ Math.floor(Math.random() * available.length) ];
							if (game.currentUser === game.challenger.userId || game.challenger.userId === client.user.id)
							{
								game.challenger.positions.push(pick);
								game.currentUser = game.opponent.userId;
							}
							else
							{
								game.opponent.positions.push(pick);
								game.currentUser = game.challenger.userId;
							}
						}

						filledSlots.push(...game.challenger.positions.slice(-1), ...game.opponent.positions.slice(-1));
					}

					const winCombos = [ [ "0", "1", "2" ], [ "3", "4", "5" ], [ "6", "7", "8" ], [ "0", "3", "6" ], [ "1", "4", "7" ], [ "2", "5", "8" ], [ "0", "4", "8" ], [ "2", "4", "6" ] ];
					const hasWon = (positions) => winCombos.some(combo => combo.every(i => positions.includes(i)));

					let result = null;
					if (hasWon(game.challenger.positions))
					{
						result = { winner: game.challenger.userId };
					}
					else if (hasWon(game.opponent.positions))
					{
						result = { winner: game.opponent.userId };
					}
					else if (game.challenger.positions.length + game.opponent.positions.length >= 9)
					{
						result = { draw: true };
					}

					const finalBoard = buildBoard();
					const finalFilled = [ ...game.challenger.positions, ...game.opponent.positions ];

					if (result)
					{
						const allGames = client.games.get("tictactoe") || {};
						const newGames = { ...allGames };
						delete newGames[ uniqueId ];
						client.games.set("tictactoe", newGames);

						const winnerText = result.draw ? "The game is a draw!" : `<@${result.winner}> wins!`;

						await interaction.message.edit({
							embeds: [
								basicEmbed({
									author: { name: "TicTacToe" },
									description: `${winnerText}\n\n${finalBoard}`,
									color: 16231462
								})
							],
							components: getTicTacToeButtons([ "0", "1", "2", "3", "4", "5", "6", "7", "8" ], uniqueId) // all disabled
						});
					}
					else
					{
						await interaction.message.edit({
							embeds: [
								basicEmbed({
									author: { name: "TicTacToe" },
									description: `It's now <@${game.currentUser}>'s turn.\n\n${finalBoard}`,
									color: 16231462
								})
							],
							components: getTicTacToeButtons(finalFilled, uniqueId)
						});
					}
				}

				else if (customId.startsWith("rps_"))
				{
					const parts = customId.split("_");
					if (parts.length < 3)
					{
						return interaction.reply({
							content: "Invalid button.",
							flags: Flags.EPHEMERAL
						});
					}
					const picked = parts[ 1 ];
					const uniqueId = parts.slice(2).join("_");

					const rpsGames = client.games.get("rps") || {};
					const game = rpsGames[ uniqueId ];
					if (!game)
					{
						return interaction.reply({ content: "Game not found or has expired.", flags: Flags.EPHEMERAL });
					}

					const uid = interaction.user.id;
					const isChallenger = uid === game.challenger?.userId;
					const isOpponent = uid === game.opponent?.userId;

					if (!isChallenger && !isOpponent && !(game.opponent?.userId === client.user.id && isChallenger))
					{
						return interaction.reply({ content: "You are not part of this game.", flags: Flags.EPHEMERAL });
					}

					const choiceMap = { r: "rock", p: "paper", s: "scissors" };
					const pick = choiceMap[ picked ];
					if (!pick) return interaction.reply({ content: "Unknown choice.", flags: Flags.EPHEMERAL });

					if (isChallenger && game.challenger.choice)
					{
						return interaction.reply({ content: "You already chose.", flags: Flags.EPHEMERAL });
					}
					if (isOpponent && game.opponent.choice)
					{
						return interaction.reply({ content: "You already chose.", flags: Flags.EPHEMERAL });
					}

					if (isChallenger)
					{
						game.challenger.choice = pick;
					}
					else if (isOpponent)
					{
						game.opponent.choice = pick;
					}

					const message = interaction.message;

					if (game.opponent?.userId === client.user.id && game.challenger.choice && !game.opponent.choice)
					{
						await interaction.update({
							embeds: [
								basicEmbed({
									author: { name: "Rock-Paper-Scissors" },
									description: `I'm thinking... 🤔\n\n<@${game.challenger.userId}>: **${game.challenger.choice}**\nMe: ❓`,
									color: 16231462
								})
							],
							components: message.components
						});

						await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 seconds

						const picks = [ "rock", "paper", "scissors" ];
						game.opponent.choice = picks[ Math.floor(Math.random() * picks.length) ];
					}

					const finished = game.challenger.choice && game.opponent.choice;

					if (finished)
					{
						const a = game.challenger.choice;
						const b = game.opponent.choice;

						let resultText;
						if (a === b)
						{
							resultText = "It's a tie!";
						}
						else if ((a === "rock" && b === "scissors") || (a === "paper" && b === "rock") || (a === "scissors" && b === "paper"))
						{
							resultText = `<@${game.challenger.userId}> wins!`;
						}
						else
						{
							resultText = `<@${game.opponent.userId}> wins!`;
						}

						const description = `Results:\n<@${game.challenger.userId}>: **${a}**\n<@${game.opponent.userId}>: **${b}**\n\n${resultText}`;

						const disabledComponents = message.components.map(row => ({
							type: 1,
							components: row.components.map(btn => ({ ...btn.toJSON(), disabled: true }))
						}));

						const allGames = client.games.get("rps") || {};
						const newGames = { ...allGames };
						delete newGames[ uniqueId ];
						client.games.set("rps", newGames);

						await message.edit({
							embeds: [
								basicEmbed({
									author: { name: "Rock-Paper-Scissors" },
									description,
									color: 16231462
								})
							],
							components: disabledComponents
						});
					}
					else
					{
						const challengerStatus = game.challenger.choice ? "Chosen" : "Waiting";
						const opponentStatus = game.opponent?.userId === client.user.id
							? (game.opponent.choice ? "Chosen" : "Bot")
							: (game.opponent.choice ? "Chosen" : "Waiting");

						const description = `You have chosen to play rock-paper-scissors against ${game.opponent?.userId === client.user.id ? "**ME**" : `<@${game.opponent.userId}>`}!\n\nCurrently waiting for:\n<@${game.challenger.userId}>: ${challengerStatus}\n${game.opponent?.userId === client.user.id ? "Me" : `<@${game.opponent.userId}>`}: ${opponentStatus}`;

						await interaction.update({
							embeds: [
								basicEmbed({
									author: { name: "Rock-Paper-Scissors" },
									description,
									color: 16231462
								})
							],
							components: message.components
						});
					}
				}

			}
			catch (err)
			{
				console.error("Error handling component interaction:", err);
				try
				{
					if (!interaction.replied && !interaction.deferred)
					{
						await interaction.reply({
							content: "Error handling button interaction.",
							flags: Flags.EPHEMERAL
						});
					}
				}
				catch
				{
				}
			}
		}

	});
}