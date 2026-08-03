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
import { MessageFlags } from "discord.js";

@Category(CommandCategory.FUN)
@StaffOnly()
export default class UwuifyCommand extends BaseSlashCommand
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            name: "uwu",
            description: "Turn any text into cute, uwuified text!",
            cooldown: 5,
            usage: "/uwu <text>",
            construct: () =>
                new Builder<"SlashCommandBuilder">()
                    .setName("uwu")
                    .setDescription("Turn any text into cute, uwuified text!")
                    .addStringOption((option) =>
                        option
                            .setName("text")
                            .setDescription("The text to uwuify.")
                            .setRequired(true),
                    ),
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

    async execute(interaction: Interaction<"ChatInput">): Promise<void>
    {
        const text = interaction.options.getString("text");

        if (!text)
        {
            await interaction.reply({
                content: "Please provide some text to uwuify!",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const uwuifiedText = this.uwuify(text);

        await interaction.reply({
            content: uwuifiedText,
            allowedMentions: { parse: [] },
        });
    }
}
