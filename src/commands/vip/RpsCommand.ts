import {
    BaseSlashCommand,
    Builder,
    Interaction,
} from "@/structures/base/commands/BaseSlashCommand";
import {
    Category,
    VipChannel,
} from "@/structures/base/commands/CommandDecorators";
import { ExtendedClient } from "@/structures/Client";
import { CommandCategory } from "@/types/CommandCategories";
import { activeRpsGames, generateUniqueId } from "@/utils/Games";
import { ComponentFactory } from "@/utils/ComponentFactory";
import { MessageFlags, ActionRowBuilder, ButtonBuilder } from "discord.js";

@Category(CommandCategory.VIP)
@VipChannel()
export default class RpsCommand extends BaseSlashCommand
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            name: "rps",
            description: "Play a game of rock-paper-scissors!",
            cooldown: 5,
            usage: "/rps [member]",
            construct: () =>
                new Builder<"SlashCommandBuilder">()
                    .setName("rps")
                    .setDescription("Play a game of rock-paper-scissors!")
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

        const isAgainstBot = opponentId === this.client.user?.id;

        if (opponentId === interaction.user.id)
        {
            await interaction.reply({
                content: "You cannot play against yourself!",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const existingGame = Array.from(activeRpsGames.values()).find(
            (game) =>
                game.opponentId === interaction.user.id ||
                game.challengerId === interaction.user.id,
        );

        if (existingGame)
        {
            const otherPlayerId =
                existingGame.opponentId === interaction.user.id
                    ? existingGame.challengerId
                    : existingGame.opponentId;

            await interaction.reply({
                content: `You already have an ongoing game with <@${otherPlayerId}>. End that game before starting a new one!`,
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const msg = isAgainstBot
            ? "You've challenged **me** to rock-paper-scissors! 😏\n\nMake your choice, I'm ready to beat you."
            : `<@${interaction.user.id}> has challenged <@${opponentId}> to rock-paper-scissors!\n\nWaiting for both players to make their move.`;

        const uniqueId = generateUniqueId();

        activeRpsGames.set(uniqueId, {
            uniqueId,
            challengerId: interaction.user.id,
            opponentId,
            isAgainstBot,
        });

        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            ComponentFactory.createThemedButton("secondary", {
                customId: `rps_r_${uniqueId}`,
                label: "Rock",
                emoji: "🪨",
            }),
            ComponentFactory.createThemedButton("secondary", {
                customId: `rps_p_${uniqueId}`,
                label: "Paper",
                emoji: "📄",
            }),
            ComponentFactory.createThemedButton("secondary", {
                customId: `rps_s_${uniqueId}`,
                label: "Scissors",
                emoji: "✂️",
            }),
        );

        const container = ComponentFactory.newContainer()
            .setAccentColor(0x5865f2)
            .addTextDisplayComponents((text) =>
                text.setContent(`## Rock-Paper-Scissors\n\n${msg}`),
            );

        await interaction.reply({
            components: [container, actionRow],
            flags: MessageFlags.IsComponentsV2,
        });
    }
}
