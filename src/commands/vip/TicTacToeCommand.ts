import {
    BaseSlashCommand,
    Builder,
    Interaction,
} from "@/structures/base/commands/BaseSlashCommand";
import { ExtendedClient } from "@/structures/Client";
import { CommandCategory } from "@/types/CommandCategories";
import { activeTicTacToeGames, generateUniqueId } from "@/utils/Games";
import { getTicTacToeButtons } from "@/utils/TicTacToeUtils";
import { ComponentFactory } from "@/utils/ComponentFactory";
import { MessageFlags } from "discord.js";

export default class TicTacToeCommand extends BaseSlashCommand
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            name: "tictactoe",
            description: "Play a game of tic-tac-toe against another user!",
            category: CommandCategory.VIP,
            cooldown: 5,
            usage: "/tictactoe [member]",
            permissions: [],
            constraints: {
                vipChannel: true,
            },
            construct: () =>
                new Builder<"SlashCommandBuilder">()
                    .setName("tictactoe")
                    .setDescription("Play a game of tic-tac-toe against another user!")
                    .addUserOption((option) =>
                        option
                            .setName("member")
                            .setDescription(
                                "The user to play against (leave empty to play against the bot)",
                            ),
                    ),
        });
    }

    async execute(interaction: Interaction<"ChatInput">): Promise<void>
    {
        const selectedOpponent = interaction.options.getUser("member");

        if (selectedOpponent?.id == "720820224877789204")
        {
            await interaction.reply({
                content: "You cannot play against this user!",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const opponentId = selectedOpponent
            ? selectedOpponent.bot
                ? this.client.user?.id
                : selectedOpponent.id
            : this.client.user?.id;

        if (!opponentId) return;

        const isBot = opponentId === this.client.user?.id;

        if (!isBot && opponentId === interaction.user.id)
        {
            await interaction.reply({
                content: "You cannot play against yourself!",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const existingGame = Array.from(activeTicTacToeGames.values()).find(
            (game) =>
                game.opponentId === interaction.user.id ||
                game.challengerId === interaction.user.id,
        );

        if (existingGame)
        {
            const otherId =
                existingGame.opponentId === interaction.user.id
                    ? existingGame.challengerId
                    : existingGame.opponentId;

            await interaction.reply({
                content: `You already have a game with <@${otherId}>. End that game before starting a new one!`,
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const uniqueId = generateUniqueId();
        const board = Array(9).fill(null);

        activeTicTacToeGames.set(uniqueId, {
            uniqueId,
            challengerId: interaction.user.id,
            opponentId,
            isBot,
            turn: interaction.user.id,
            board,
        });

        const opponentMention = isBot ? "the bot" : `<@${opponentId}>`;

        const container = ComponentFactory.newContainer()
            .setAccentColor(0x5865f2)
            .addTextDisplayComponents((text) =>
                text.setContent(
                    `## TicTacToe\n\nThe ultimate game of TicTacToe between <@${interaction.user.id}> and ${opponentMention}.\n\nWaiting for <@${interaction.user.id}> to choose.`,
                ),
            );

        const rows = getTicTacToeButtons(board, uniqueId);

        await interaction.reply({
            components: [container.toJSON() as any, ...(rows.map((r) => r.toJSON()) as any)],
            flags: MessageFlags.IsComponentsV2,
        });
    }
}
