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
import { Delay } from "@/utils/Delay";
import { ContainerBuilder, MessageFlags, SeparatorSpacingSize } from "discord.js";
import { CustomEmoji } from "@/types/Emoji";

@Category(CommandCategory.VIP)
@VipChannel()
export default class DiceCommand extends BaseSlashCommand
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            name: "dice",
            description: "Roll a dice and guess the number!",
            cooldown: 5,
            usage: "/dice <number>",
            construct: () =>
                new Builder<"SlashCommandBuilder">()
                    .setName("dice")
                    .setDescription("Roll a dice and guess the number!")
                    .addIntegerOption((option) =>
                        option
                            .setName("guess")
                            .setDescription("Your guess for the dice roll")
                            .setMinValue(1)
                            .setMaxValue(6)
                            .setRequired(true),
                    ),
        });
    }

    async execute(interaction: Interaction<"ChatInput">): Promise<void>
    {
        const n = Math.floor(Math.random() * 6) + 1;
        const guess = interaction.options.getInteger("guess");

        const component = new ContainerBuilder()
            .addTextDisplayComponents((textDisplay) => textDisplay.setContent("## 🎲 Dice"))
            .addSeparatorComponents((separator) => separator.setDivider(true))
            .addTextDisplayComponents((textDisplay) =>
                textDisplay.setContent(
                    `You guessed **${guess}** and the coin landed on **${n}**. You ${guess === n ? "win!" : "lose!"}`,
                ),
            );

        await interaction.reply({
            content: `-# ${CustomEmoji.loading} Castor is rolling the dice...`,
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
