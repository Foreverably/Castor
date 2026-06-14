import {
    BaseSlashCommand,
    Builder,
    Interaction,
} from "@/structures/base/commands/BaseSlashCommand";
import {
    Category,
    RestrictedFunCommands,
} from "@/structures/base/commands/CommandDecorators";
import { ExtendedClient } from "@/structures/Client";
import { CommandCategory } from "@/types/CommandCategories";
import { JokesDatabase } from "@/utils/JokesDatabase";
import {
    Message,
    MessageCollector,
    MessageFlags,
    ReadonlyCollection,
    SlashCommandBuilder,
} from "discord.js";

@Category(CommandCategory.VIP)
@RestrictedFunCommands()
export default class DadJokeCommand extends BaseSlashCommand
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            name: "dadjoke",
            description: "We love dad jokes!",
            cooldown: 5,
            usage: "/dadjoke",
            construct: () =>
                new Builder<"SlashCommandBuilder">()
                    .setName("dadjoke")
                    .setDescription("We love dad jokes!"),
        });
    }

    async execute(interaction: Interaction<"ChatInput">): Promise<void>
    {
        const joke = await JokesDatabase.getRandomJoke();

        if (!joke)
        {
            await interaction.reply({
                content: "No jokes available... someone ate the dad-joke book! 😭",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const setupText = joke.setup;
        const punchlineText = joke.punchline;

        if (!setupText || !punchlineText)
        {
            this.client.logger.error("Joke object is missing keys:", joke);
            await interaction.reply({
                content: "Error: This joke is formatted incorrectly in the database.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.reply(`${setupText}`);

        if (!interaction.channel)
        {
            await interaction.followUp(`**${punchlineText}**`);
            return;
        }

        const filter = (m: Message) => m.author.id === interaction.user.id;

        const collector = new MessageCollector(interaction.channel, {
            filter,
            time: 30000,
            max: 1,
        });

        collector.once("end", (collected: ReadonlyCollection<string, Message>) =>
        {
            if (collected.size > 0)
            {
                interaction.followUp(`**${punchlineText}**`);
            }
            else
            {
                interaction.followUp(`Too slow! The answer was: **${punchlineText}**`);
            }
        });
    }
}
