import {
    BaseSlashCommand,
    Builder,
    Interaction,
} from "@/structures/base/commands/BaseSlashCommand";
import { ExtendedClient } from "@/structures/Client";
import { CommandCategory } from "@/types/CommandCategories";
import User from "@/schemas/user";
import { MessageFlags } from "discord.js";

function getRandomNumber(min: number, max: number): number
{
    return Math.floor(Math.random() * (max - min) + min);
}

const messages = [
    "🪙 You rummage through the couch cushions... Jackpot! You found **{{amount}} coins**!",
    "🏚️ You peek under the floorboards and discover {{amount}} dusty old coins. Nice find!",
    "🗄️ You search the drawers and—score! You pocket **{{amount}} coins**.",
    "🏆 Behind a picture frame, you find a hidden stash of **{{amount}} coins**! Who knew treasure was so close?",
    "🎩 You check inside an old top hat and—aha! **{{amount}} coins** spill out.",
    "📦 You open a suspicious-looking box and—bingo! **{{amount}} coins** are now yours.",
    "🏠 You tap the walls and find a secret compartment! Inside? {{amount}} shiny coins!",
    "📚 You flip through an old book and—what’s this? A hidden slot containing **{{amount}} coins**!",
    "🛏️ You lift the mattress and, lo and behold, **{{amount}} coins** were hiding there all along!",
    "🗑️ You reluctantly check the trash can... and somehow, you find **{{amount}} coins**. Gross, but worth it!",
];

export default class SearchCommand extends BaseSlashCommand
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            name: "search",
            description: "Search your surroundings for some coins!",
            category: CommandCategory.VIP,
            cooldown: 5,
            usage: "/search",
            permissions: [],
            constraints: {
                vipChannel: true,
            },
            construct: () =>
                new Builder<"SlashCommandBuilder">()
                    .setName("search")
                    .setDescription("Search your surroundings for some coins!"),
        });
    }

    async execute(interaction: Interaction<"ChatInput">): Promise<void>
    {
        try
        {
            const amount = getRandomNumber(3, 8);

            let user = await User.findOne({ userId: interaction.user.id });
            if (!user)
            {
                user = new User({
                    userId: interaction.user.id,
                    username: interaction.user.username,
                    balance: 0,
                    search: { next: 0, count: 0, amount: 0 },
                });
            }

            if (user.search && user.search.next > Date.now())
            {
                const time = Math.floor(user.search.next / 1000);
                await interaction.reply({
                    content: `You can only search once every <t:${time}:R>!`,
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            if (!user.search)
            {
                user.search = { next: 0, count: 0, amount: 0 };
            }

            user.balance += amount;
            user.search.next = Date.now() + 30000;
            user.search.count += 1;
            user.search.amount += amount;
            user.username = interaction.user.username;

            user.markModified("search");
            await user.save();

            const randomMessage = messages[getRandomNumber(0, messages.length)].replace(
                "{{amount}}",
                amount.toString(),
            );

            const time = Math.floor((Date.now() + 30000) / 1000);

            await interaction.reply({
                content: `${randomMessage}\n\nYou can search again <t:${time}:R>!`,
            });
        }
        catch (error)
        {
            console.error(interaction.user.id, error);
            await interaction
                .reply({
                    content: "An error occurred while searching.",
                    flags: MessageFlags.Ephemeral,
                })
                .catch(() =>
                {});
        }
    }
}
