import {
    BaseSlashCommand,
    Builder,
    Interaction,
} from "@/structures/base/commands/BaseSlashCommand";
import {
    Category,
    StaffOnly,
} from "@/structures/base/commands/CommandDecorators";
import { ExtendedClient } from "@/structures/Client";
import { CommandCategory } from "@/types/CommandCategories";
import { Emoji } from "@/types/Emojis";
import { EmbedBuilder, MessageFlags } from "discord.js";

@Category(CommandCategory.FUN)
@StaffOnly()
export default class BamCommand extends BaseSlashCommand
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            name: "bam",
            description: "Bam someone!",
            cooldown: 10,
            usage: "/bam <user> [reason]",
            construct: () =>
                new Builder<"SlashCommandBuilder">()
                    .setName("bam")
                    .setDescription("Bam someone!")
                    .addUserOption((option) =>
                        option
                            .setName("user")
                            .setDescription("The user to bam.")
                            .setRequired(true),
                    )
                    .addStringOption((option) =>
                        option
                            .setName("reason")
                            .setDescription("The reason for the bam."),
                    ),
        });
    }

    async execute(interaction: Interaction<"ChatInput">): Promise<void>
    {
        if (!interaction.inGuild())
        {
            await interaction.reply({
                content: "This command can only be used in a server.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const targetUser = interaction.options.getUser("user");
        const reason = interaction.options.getString("reason") || "No reason provided.";

        if (!targetUser)
        {
            await interaction.reply({
                content: "Please specify a user to bam!",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.deferReply();

        const targetMember = await interaction.guild!.members
            .fetch(targetUser.id)
            .catch(() => null);

        if (!targetMember)
        {
            await interaction.editReply("Could not find that member.");
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(0x38f075)
            .setDescription(
                `${Emoji.Check} <@${targetMember.id}> **was bammed** || ${reason}`,
            );

        await interaction.editReply({ embeds: [embed] });
    }
}
