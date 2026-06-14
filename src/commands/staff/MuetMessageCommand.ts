import { BaseMessageCommand } from "@/structures/base/commands/BaseMessageCommand";
import { Category, StaffOnly } from "@/structures/base/commands/CommandDecorators";
import { ExtendedClient } from "@/structures/Client";
import { CommandCategory } from "@/types/CommandCategories";
import { CustomEmoji } from "@/types/Emoji";
import { Message, EmbedBuilder, PermissionsBitField } from "discord.js";

@Category(CommandCategory.FUN)
@StaffOnly()
export default class MuetMessageCommand extends BaseMessageCommand
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            name: "muet",
            description: "Muet someone!",
            cooldown: 10,
            usage: "muet [user] [reason]",
        });
    }

    async execute(message: Message, args: string[]): Promise<void>
    {
        if (!message.inGuild())
        {
            await message.reply("This command can only be used in a server.");
            return;
        }

        let targetMember = null;
        let reason = "No reason provided.";

        const reference = message.reference;
        if (reference && reference.messageId)
        {
            const repliedMessage =
                message.channel.messages.cache.get(reference.messageId) ||
                (await message.channel.messages.fetch(reference.messageId).catch(() => null));

            if (repliedMessage)
            {
                targetMember =
                    repliedMessage.member ||
                    (await message.guild?.members
                        .fetch(repliedMessage.author.id)
                        .catch(() => null));

                if (targetMember)
                {
                    reason = args.slice(1).join(" ") || "No reason provided.";
                }
            }
        }

        if (!targetMember)
        {
            const targetArg = args[1];
            if (!targetArg)
            {
                await message.reply("Please specify a user to muet!");
                return;
            }

            const targetId = targetArg.replace(/[<@!>]/g, "");
            targetMember =
                message.mentions.members?.first() ||
                message.guild?.members.cache.get(targetId) ||
                (await message.guild?.members.fetch(targetId).catch(() => null));

            if (!targetMember)
            {
                await message.reply("Could not find that member.");
                return;
            }

            reason = args.slice(2).join(" ") || "No reason provided.";
        }

        const botMember = message.guild?.members.me;
        const canDelete = botMember
            ?.permissionsIn(message.channel)
            .has(PermissionsBitField.Flags.ManageMessages);
        if (canDelete) await message.delete().catch(() => null);

        const embed = new EmbedBuilder()
            .setColor(0x38f075)
            .setDescription(
                `${CustomEmoji.check} <@${targetMember.id}> **was mueted** || ${reason}`,
            );

        await message.channel.send({ embeds: [embed] });
    }
}
