import {
    BaseSlashCommand,
    Builder,
    Interaction,
} from "@/structures/base/commands/BaseSlashCommand";
import { ExtendedClient } from "@/structures/Client";
import { CommandCategory } from "@/types/CommandCategories";
import { Delay } from "@/utils/Delay";
import { ContainerBuilder, MessageFlags, SeparatorSpacingSize } from "discord.js";
import { CustomEmoji } from "@/types/Emoji";

export default class CoinFlipCommand extends BaseSlashCommand
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            name: "coinflip",
            description: "Flip a coin and guess the side!",
            category: CommandCategory.VIP,
            cooldown: 5,
            constraints: {
                vipChannel: true,
            },
            usage: "/coinflip <side>",
            permissions: [],
            construct: () =>
                new Builder<"SlashCommandBuilder">()
                    .setName("coinflip")
                    .setDescription("Flip a coin and guess the side!")
                    .addStringOption((option) =>
                        option
                            .setName("side")
                            .setDescription("The side you want to guess..")
                            .addChoices(
                                { name: "Heads", value: "heads" },
                                { name: "Tails", value: "tails" },
                            )
                            .setRequired(true),
                    ),
        });
    }

    async execute(interaction: Interaction<"ChatInput">): Promise<void>
    {
        const n = Math.floor(Math.random() * 2) === 0 ? "heads" : "tails";
        const guess = interaction.options.getString("side");

        const component = new ContainerBuilder()
            .addTextDisplayComponents((textDisplay) => textDisplay.setContent("## 🪙 Coinflip"))
            .addSeparatorComponents((separator) => separator.setDivider(true))
            .addTextDisplayComponents((textDisplay) =>
                textDisplay.setContent(
                    `You guessed **${guess}** and the coin landed on **${n}**. You ${guess === n ? "win!" : "lose!"}`,
                ),
            );

        await interaction.reply({
            content: `-# ${CustomEmoji.loading} Castor is flipping the coin...`,
        });

        Delay(1200).then(() =>
        {
            interaction.editReply({
                content: null,
                components: [component],
                flags: MessageFlags.IsComponentsV2,
            });
        });
    }
}
