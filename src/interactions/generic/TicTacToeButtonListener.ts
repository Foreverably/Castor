import {
    BaseInteractionListener,
    InteractionBuilder,
    InteractionContext,
    isComponentInteraction,
} from "@/structures/base";
import { ExtendedClient } from "@/structures/Client";
import { ComponentType, InteractionType, MessageFlags } from "discord.js";
import { activeTicTacToeGames } from "@/utils/Games";
import { ComponentFactory } from "@/utils/ComponentFactory";
import { getTicTacToeButtons, checkWin, checkDraw, getBotMove } from "@/utils/TicTacToeUtils";

export default class TicTacToeButtonListener extends BaseInteractionListener
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            enabled: true,
            build: () =>
                new InteractionBuilder<"InteractionListener">()
                    .setCustomId("ttt")
                    .setDescription("Handles TicTacToe buttons")
                    .setInteractionType(InteractionType.MessageComponent)
                    .setComponentType(ComponentType.Button),
        });
    }

    public async handle(
        interaction: InteractionContext<"ContextMenu" | "Autocomplete" | "Component">,
    ): Promise<boolean>
    {
        if (!this.enabled || !isComponentInteraction(interaction)) return false;

        if (interaction.customId.startsWith("ttt_"))
        {
            return await this.onInteraction(interaction);
        }
        return false;
    }

    public async onInteraction(interaction: InteractionContext<"Component">): Promise<boolean>
    {
        if (!interaction.isButton()) return false;

        const parts = interaction.customId.split("_");
        const index = parseInt(parts[1], 10);
        const uniqueId = parts[2];

        const game = activeTicTacToeGames.get(uniqueId);

        if (!game)
        {
            await interaction.reply({
                content: "This game has expired or is invalid.",
                flags: MessageFlags.Ephemeral,
            });
            return true;
        }

        if (interaction.user.id !== game.challengerId && interaction.user.id !== game.opponentId)
        {
            await interaction.reply({
                content: "You are not a part of this game!",
                flags: MessageFlags.Ephemeral,
            });
            return true;
        }

        if (interaction.user.id !== game.turn)
        {
            await interaction.reply({
                content: "It's not your turn!",
                flags: MessageFlags.Ephemeral,
            });
            return true;
        }

        if (game.board[index] !== null)
        {
            await interaction.reply({
                content: "This spot is already taken!",
                flags: MessageFlags.Ephemeral,
            });
            return true;
        }

        const isChallenger = interaction.user.id === game.challengerId;
        game.board[index] = isChallenger ? "X" : "O";

        let win = checkWin(game.board);
        let draw = checkDraw(game.board);

        if (!win && !draw && game.isBot)
        {
            const botMoveIndex = getBotMove(game.board);
            if (botMoveIndex !== undefined && botMoveIndex !== null)
            {
                game.board[botMoveIndex] = "O";
                win = checkWin(game.board);
                draw = checkDraw(game.board);
            }
        }
        else if (!win && !draw)
        {
            game.turn = isChallenger ? game.opponentId : game.challengerId;
        }

        const opponentMention = game.isBot ? "the bot" : `<@${game.opponentId}>`;

        if (win || draw)
        {
            let resultMsg = "";
            if (win)
            {
                const winnerId = win === "X" ? game.challengerId : game.opponentId;
                resultMsg =
                    winnerId === game.opponentId && game.isBot
                        ? `The bot wins!`
                        : `<@${winnerId}> wins!`;
            }
            else
            {
                resultMsg = "It's a draw!";
            }

            const container = ComponentFactory.newContainer()
                .setAccentColor(win ? 0x00ff00 : 0xffff00)
                .addTextDisplayComponents((text) =>
                    text.setContent(`## TicTacToe Result\n\n${resultMsg}`),
                );

            const rows = getTicTacToeButtons(game.board, uniqueId, true);

            await interaction.update({
                components: [container.toJSON() as any, ...(rows.map((r) => r.toJSON()) as any)],
            });

            activeTicTacToeGames.delete(uniqueId);
        }
        else
        {
            const currentTurnMention =
                game.turn === game.opponentId && game.isBot ? "the bot" : `<@${game.turn}>`;
            const container = ComponentFactory.newContainer()
                .setAccentColor(0x5865f2)
                .addTextDisplayComponents((text) =>
                    text.setContent(
                        `## TicTacToe\n\nThe ultimate game of TicTacToe between <@${game.challengerId}> and ${opponentMention}.\n\nWaiting for ${currentTurnMention} to choose.`,
                    ),
                );

            const rows = getTicTacToeButtons(game.board, uniqueId);

            await interaction.update({
                components: [container.toJSON() as any, ...(rows.map((r) => r.toJSON()) as any)],
            });
        }

        return true;
    }
}
