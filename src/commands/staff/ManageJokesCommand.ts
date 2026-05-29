import {
    BaseSlashCommand,
    Builder,
    Interaction,
} from "@/structures/base/commands/BaseSlashCommand";
import { ExtendedClient } from "@/structures/Client";
import { CommandCategory } from "@/types/CommandCategories";
import { JokesDatabase } from "@/utils/JokesDatabase";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
    MessageFlags,
    SlashCommandBuilder,
} from "discord.js";

export default class ManageJokesCommand extends BaseSlashCommand
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            name: "managejokes",
            description: "Manage the dad-joke collection",
            category: CommandCategory.ADMIN,
            cooldown: 5,
            usage: "/managejokes [add|remove|list]",
            permissions: ["ManageMessages"],
            construct: () =>
                new Builder<"SlashCommandBuilder">()
                    .setName("managejokes")
                    .setDescription("Manage the dad-joke collection")
                    .addSubcommand((subcommand) =>
                        subcommand
                            .setName("add")
                            .setDescription("Add a new joke to the collection")
                            .addStringOption((option) =>
                                option
                                    .setName("setup")
                                    .setDescription(
                                        "The setup (e.g., Why did the chicken cross the road?)",
                                    )
                                    .setRequired(true),
                            )
                            .addStringOption((option) =>
                                option
                                    .setName("punchline")
                                    .setDescription(
                                        "The punchline (e.g., To get to the other side!)",
                                    )
                                    .setRequired(true),
                            ),
                    )
                    .addSubcommand((subcommand) =>
                        subcommand
                            .setName("remove")
                            .setDescription("Remove a joke by its index")
                            .addIntegerOption((option) =>
                                option
                                    .setName("index")
                                    .setDescription(
                                        "0-based index of the joke to remove (use /managejokes list first)",
                                    )
                                    .setRequired(true)
                                    .setMinValue(0),
                            ),
                    )
                    .addSubcommand((subcommand) =>
                        subcommand
                            .setName("list")
                            .setDescription("Show all current jokes in the collection"),
                    ),
        });
    }

    async execute(interaction: Interaction<"ChatInput">): Promise<void>
    {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === "add")
        {
            const setup = interaction.options.getString("setup", true).trim();
            const punchline = interaction.options.getString("punchline", true).trim();

            await JokesDatabase.addJoke(setup, punchline);
            const jokes = await JokesDatabase.getJokes();

            await interaction.reply({
                content: `Joke added! (total now: ${jokes.length})\n**Setup:** ${setup}\n**Punchline:** ${punchline}`,
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        if (subcommand === "remove")
        {
            const index = interaction.options.getInteger("index", true);
            const jokes = await JokesDatabase.getJokes();

            if (index < 0 || index >= jokes.length)
            {
                await interaction.reply({
                    content: `❌ Invalid index. Use \`/managejokes list\` to see valid numbers (0 to ${jokes.length - 1}).`,
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const removed = await JokesDatabase.removeJokeByIndex(index);
            const remainingJokes = await JokesDatabase.getJokes();

            if (removed)
            {
                await interaction.reply({
                    content: `Removed joke #${index}:\n> ${removed.setup}\n> ||${removed.punchline}||\n(total now: ${remainingJokes.length})`,
                    flags: MessageFlags.Ephemeral,
                });
            }
            else
            {
                await interaction.reply({
                    content: `❌ Failed to remove joke at index ${index}.`,
                    flags: MessageFlags.Ephemeral,
                });
            }
            return;
        }

        if (subcommand === "list")
        {
            const jokes = await JokesDatabase.getJokes();

            if (jokes.length === 0)
            {
                await interaction.reply({
                    content: "😢 The joke list is currently empty.",
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const itemsPerPage = 5;
            const totalPages = Math.ceil(jokes.length / itemsPerPage);
            let currentPage = 0;

            const generateEmbed = (page: number) =>
            {
                const start = page * itemsPerPage;
                const end = start + itemsPerPage;
                const pageItems = jokes.slice(start, end);

                const embed = new EmbedBuilder()
                    .setColor(0xfee75c)
                    .setTitle(`Dad Jokes Collection  (Page ${page + 1}/${totalPages})`)
                    .setDescription(`Total: **${jokes.length}** jokes`)
                    .setFooter({
                        text: "Index starts at 0 • Use /managejokes remove <index>",
                    });

                const descriptionLines = pageItems.map((joke, idx) =>
                {
                    const globalIndex = start + idx;
                    return `**${globalIndex}.** ${joke.setup}\n   *${joke.punchline}*`;
                });

                embed.setDescription(descriptionLines.join("\n") || "(empty page?)");

                return embed;
            };

            const createButtons = (page: number) =>
            {
                return new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId("prev")
                        .setLabel("◀")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === 0),
                    new ButtonBuilder()
                        .setCustomId("next")
                        .setLabel("▶")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === totalPages - 1),
                );
            };

            await interaction.reply({
                embeds: [generateEmbed(currentPage)],
                components: [createButtons(currentPage)],
                flags: MessageFlags.Ephemeral,
            });

            const message = await interaction.fetchReply();

            const collector = message.createMessageComponentCollector({
                filter: (i) => i.user.id === interaction.user.id,
                time: 5 * 60 * 1000,
                componentType: ComponentType.Button,
            });

            collector.on("collect", async (buttonInteraction) =>
            {
                if (buttonInteraction.customId === "prev" && currentPage > 0)
                {
                    currentPage--;
                }
                else if (buttonInteraction.customId === "next" && currentPage < totalPages - 1)
                {
                    currentPage++;
                }

                await buttonInteraction.update({
                    embeds: [generateEmbed(currentPage)],
                    components: [createButtons(currentPage)],
                });
            });

            collector.on("end", async () =>
            {
                await interaction
                    .editReply({
                        components: [
                            new ActionRowBuilder<ButtonBuilder>().addComponents(
                                new ButtonBuilder()
                                    .setCustomId("prev")
                                    .setLabel("◀ Prev")
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId("next")
                                    .setLabel("Next ▶")
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(true),
                            ),
                        ],
                    })
                    .catch(() =>
                    {});
            });

            return;
        }

        await interaction.reply({
            content: "Unknown subcommand.",
            flags: MessageFlags.Ephemeral,
        });
    }
}
