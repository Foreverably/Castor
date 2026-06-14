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
import { replies } from "@/types/8BallReplies";
import { Delay } from "@/utils/Delay";
import { ContainerBuilder, MessageFlags, SeparatorSpacingSize } from "discord.js";
import { CustomEmoji } from "@/types/Emoji";

@Category(CommandCategory.VIP)
@VipChannel()
export default class EightBallCommand extends BaseSlashCommand
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            name: "8ball",
            description: "Ask the lovely magic 8ball a question.",
            cooldown: 5,
            usage: "/8ball <question>",
            construct: () =>
                new Builder<"SlashCommandBuilder">()
                    .setName("8ball")
                    .setDescription("Ask the lovely magic 8ball a question.")
                    .addStringOption((option) =>
                        option
                            .setName("question")
                            .setDescription("The question to ask the 8ball.")
                            .setRequired(true),
                    ),
        });
    }

    async execute(interaction: Interaction<"ChatInput">): Promise<void>
    {
        const result = replies[Math.floor(Math.random() * replies.length)];
        const question = interaction.options.getString("question");

        const component = new ContainerBuilder()
            .addTextDisplayComponents((textDisplay) => textDisplay.setContent("## 🎱 8ball"))
            .addSeparatorComponents((separator) => separator.setDivider(true))
            .addTextDisplayComponents((textDisplay) =>
                textDisplay.setContent("-# Question:\n" + question),
            )
            .addSeparatorComponents((separator) =>
                separator.setDivider(false).setSpacing(SeparatorSpacingSize.Large),
            )
            .addTextDisplayComponents((textDisplay) =>
                textDisplay.setContent("-# Answer: \n" + result),
            );

        await interaction.reply({
            content: `-# ${CustomEmoji.loading} Castor is thinking...`,
        });

        Delay(Math.random() * 3000 + 1000).then(() =>
        {
            interaction.editReply({
                content: null,
                components: [component],
                flags: MessageFlags.IsComponentsV2,
            });
        });
    }
}
