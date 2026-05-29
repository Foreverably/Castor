import {
    BaseInteractionListener,
    InteractionBuilder,
    InteractionContext,
    isComponentInteraction,
} from "@/structures/base";
import { ExtendedClient } from "@/structures/Client";
import { ComponentType, InteractionType, MessageFlags } from "discord.js";
import { activeRpsGames, RpsGame } from "@/utils/Games";
import { ComponentFactory } from "@/utils/ComponentFactory";

export default class RpsButtonListener extends BaseInteractionListener
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            enabled: true,
            build: () =>
                new InteractionBuilder<"InteractionListener">()
                    .setCustomId("rps")
                    .setDescription("Handles RPS buttons")
                    .setInteractionType(InteractionType.MessageComponent)
                    .setComponentType(ComponentType.Button),
        });
    }

    public async handle(
        interaction: InteractionContext<"ContextMenu" | "Autocomplete" | "Component">,
    ): Promise<boolean>
    {
        if (!this.enabled || !isComponentInteraction(interaction)) return false;

        if (interaction.customId.startsWith("rps_"))
        {
            return await this.onInteraction(interaction);
        }
        return false;
    }

    public async onInteraction(interaction: InteractionContext<"Component">): Promise<boolean>
    {
        if (!interaction.isButton()) return false;

        const parts = interaction.customId.split("_");
        const choiceStr = parts[1];
        const uniqueId = parts[2];

        const game = activeRpsGames.get(uniqueId);

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

        const choiceMap: Record<string, "rock" | "paper" | "scissors"> = {
            r: "rock",
            p: "paper",
            s: "scissors",
        };

        const choice = choiceMap[choiceStr];

        if (interaction.user.id === game.challengerId)
        {
            game.challengerChoice = choice;
        }
        else
        {
            game.opponentChoice = choice;
        }

        if (game.isAgainstBot && !game.opponentChoice)
        {
            const botChoices: ("rock" | "paper" | "scissors")[] = ["rock", "paper", "scissors"];
            game.opponentChoice = botChoices[Math.floor(Math.random() * botChoices.length)];
        }

        if (game.challengerChoice && game.opponentChoice)
        {
            const winnerId = this.determineWinner(game);

            let resultMsg = "";
            if (!winnerId)
            {
                resultMsg = `It's a tie! Both chose **${game.challengerChoice}**!`;
            }
            else if (winnerId === game.challengerId)
            {
                resultMsg = `<@${game.challengerId}> wins with **${game.challengerChoice}** against **${game.opponentChoice}**!`;
            }
            else
            {
                resultMsg = `<@${game.opponentId}> wins with **${game.opponentChoice}** against **${game.challengerChoice}**!`;
            }

            const container = ComponentFactory.newContainer()
                .setAccentColor(0x00ff00)
                .addTextDisplayComponents((text) =>
                    text.setContent(`## Rock-Paper-Scissors Result\n\n${resultMsg}`),
                );

            await interaction.update({
                content: null,
                components: [container],
            });

            activeRpsGames.delete(uniqueId);
        }
        else
        {
            await interaction.reply({
                content: "You have made your choice. Waiting for the other player...",
                flags: MessageFlags.Ephemeral,
            });
        }

        return true;
    }

    private determineWinner(game: RpsGame): string | null
    {
        if (game.challengerChoice === game.opponentChoice) return null;

        const c = game.challengerChoice;
        const o = game.opponentChoice;

        if (
            (c === "rock" && o === "scissors") ||
            (c === "paper" && o === "rock") ||
            (c === "scissors" && o === "paper")
        )
        {
            return game.challengerId;
        }
        return game.opponentId;
    }
}
