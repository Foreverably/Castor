import { BaseMessageCommand } from "@/structures/base/commands/BaseMessageCommand";
import { ExtendedClient } from "@/structures/Client";
import { CommandCategory } from "@/types/CommandCategories";
import { Message, PermissionsBitField } from "discord.js";

export default class UwuifyMessageCommand extends BaseMessageCommand
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            name: "uwu",
            description: "Turn any text into cute, uwuified text!",
            category: CommandCategory.FUN,
            cooldown: 5,
            constraints: {
                staffOnly: true,
            },
            usage: "uwu [text]",
        });
    }

    private uwuify(text: string): string
    {
        if (!text) return "";

        let uwuified = text;

        const wordReplacements: [string, string][] = [
            ["hello", "hewwo"],
            ["hi", "hewwo"],
            ["god", "gawd"],
            ["father", "daddy"],
            ["papa", "papi"],
            ["mom", "mommy"],
            ["mother", "mommy"],
        ];

        for (const [oldWord, newWord] of wordReplacements)
        {
            uwuified = uwuified.split(oldWord).join(newWord);
        }

        const charReplacements: [string, string][] = [
            ["r", "w"],
            ["l", "w"],
            ["R", "W"],
            ["L", "W"],
        ];

        for (const [oldChar, newChar] of charReplacements)
        {
            uwuified = uwuified.split(oldChar).join(newChar);
        }

        uwuified = uwuified.replace(/n([aeiou])/g, "ny$1");
        uwuified = uwuified.replace(/N([aeiou])/g, "Ny$1");
        uwuified = uwuified.replace(/N([AEIOU])/g, "NY$1");

        if (uwuified.length > 0)
        {
            const firstChar = uwuified.charAt(0);
            if (/[a-zA-Z]/.test(firstChar))
            {
                uwuified = `${firstChar}-${uwuified}`;
            }
        }

        if (uwuified.length > 0)
        {
            const lastChar = uwuified.charAt(uwuified.length - 1);
            if (/[a-zA-Z]/.test(lastChar))
            {
                uwuified = `${uwuified}~~`;
            }
        }

        return uwuified;
    }

    async execute(message: Message, args: string[]): Promise<void>
    {
        const textToUwuify = args.slice(1).join(" ");

        if (!textToUwuify)
        {
            await message.reply("Please provide some text to uwuify!");
            return;
        }

        const uwuifiedText = this.uwuify(textToUwuify);

        const botMember = message.guild?.members.me;
        const canDelete = botMember
            ?.permissionsIn(message.channel as any)
            .has(PermissionsBitField.Flags.ManageMessages);
        if (canDelete) await message.delete().catch(() => null);

        if (!message.inGuild())
        {
            await message.reply("This command can only be used in a server.");
            return;
        }

        await message.channel.send({
            content: uwuifiedText,
            allowedMentions: { parse: [] },
        });
    }
}
