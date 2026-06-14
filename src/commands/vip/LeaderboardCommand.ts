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
import User from "@/schemas/user";
import { ContainerBuilder, MessageFlags } from "discord.js";

@Category(CommandCategory.VIP)
@VipChannel()
export default class LeaderboardCommand extends BaseSlashCommand
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            name: "leaderboard",
            description: "Show the leaderboard.",
            cooldown: 5,
            usage: "/leaderboard",
            construct: () =>
                new Builder<"SlashCommandBuilder">()
                    .setName("leaderboard")
                    .setDescription("Show the leaderboard."),
        });
    }

    async execute(interaction: Interaction<"ChatInput">): Promise<void>
    {
        try
        {
            const users = await User.find().sort({ balance: -1 }).limit(10).lean();

            if (users.length === 0)
            {
                await interaction.reply({
                    content: "There are no users in the leaderboard.",
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const text = users
                .map((user, index) => `**#${index + 1}** <@${user.userId}> - ${user.balance} coins`)
                .join("\n\n");

            const component = new ContainerBuilder()
                .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent("## 🏆 Leaderboard"),
                )
                .addSeparatorComponents((separator) => separator.setDivider(true))
                .addTextDisplayComponents((textDisplay) => textDisplay.setContent(text))
                .addSeparatorComponents((separator) => separator.setDivider(true))
                .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent("-# Use /search to get some coins!"),
                );

            await interaction.reply({
                components: [component],
                allowedMentions: {
                    parse: [],
                },
                flags: MessageFlags.IsComponentsV2,
            });
        }
        catch (error)
        {
            console.error(interaction.user.id, error);
            await interaction
                .reply({
                    content: "An error occurred while fetching the leaderboard.",
                    flags: MessageFlags.Ephemeral,
                })
                .catch(() =>
                {});
        }
    }
}
