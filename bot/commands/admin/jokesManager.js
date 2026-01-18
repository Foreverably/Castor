import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	EmbedBuilder,
	SlashCommandBuilder
} from "discord.js";
import { Precondition } from "../../../plugins/preconditions/precondition.js";
import { addJoke, jokes, removeJoke } from "../../../database/jokes.js";
import { Flags } from "../../../plugins/flags/message.js";

export const data = new SlashCommandBuilder()
	.setName("managejokes")
	.setDescription("Manage the dad-joke collection")
	.addSubcommand(subcommand =>
		subcommand
			.setName("add")
			.setDescription("Add a new joke to the collection")
			.addStringOption(option =>
				option
					.setName("text")
					.setDescription("The joke text (keep it short & funny)")
					.setRequired(true)
					.setMinLength(8)
					.setMaxLength(300)
			)
	)
	.addSubcommand(subcommand =>
		subcommand
			.setName("remove")
			.setDescription("Remove a joke by its index")
			.addIntegerOption(option =>
				option
					.setName("index")
					.setDescription("0-based index of the joke to remove (use /joke list first)")
					.setRequired(true)
					.setMinValue(0)
			)
	)
	.addSubcommand(subcommand =>
		subcommand
			.setName("list")
			.setDescription("Show all current jokes in the collection")
	);

export async function execute(interaction)
{
	if (!Precondition.check.isSrMod(interaction))
	{
		return Precondition.result.denied(interaction);
	}

	const subcommand = interaction.options.getSubcommand();

	if (subcommand === "add")
	{
		const text = interaction.options.getString("text", true).trim();

		if (text.length < 8)
		{
			return interaction.reply({
				content: "❌ That joke is too short. Try something funnier!",
				flags: Flags.EPHEMERAL
			});
		}

		addJoke(text);

		return interaction.reply({
			content: `Joke added! (total now: ${jokes.length})\n\`\`\`\n${text}\n\`\`\``,
			flags: Flags.EPHEMERAL
		});
	}

	if (subcommand === "remove")
	{
		const index = interaction.options.getInteger("index", true);

		if (index < 0 || index >= jokes.length)
		{
			return interaction.reply({
				content: `❌ Invalid index. Use /joke list to see valid numbers (0 to ${jokes.length - 1}).`,
				flags: Flags.EPHEMERAL
			});
		}

		const removed = jokes[ index ];
		removeJoke(index);


		return interaction.reply({
			content: `Removed joke #${index}:\n\`\`\`\n${removed}\n\`\`\`\n(total now: ${jokes.length})`,
			flags: Flags.EPHEMERAL
		});
	}
	if (subcommand === "list")
	{
		if (jokes.length === 0)
		{
			return interaction.reply({
				content: "😢 The joke list is currently empty.",
				flags: Flags.EPHEMERAL
			});
		}

		const itemsPerPage = 10;
		const totalPages = Math.ceil(jokes.length / itemsPerPage);
		let currentPage = 0;

		const generateEmbed = (page) =>
		{
			const start = page * itemsPerPage;
			const end = start + itemsPerPage;
			const pageItems = jokes.slice(start, end);

			const embed = new EmbedBuilder()
				.setColor(0xfee75c)
				.setTitle(`Dad Jokes Collection  (Page ${page + 1}/${totalPages})`)
				.setDescription(`Total: **${jokes.length}** jokes`)
				.setFooter({
					text: "Index starts at 0 • Use /managejokes remove <index>"
				});

			const descriptionLines = pageItems.map((joke, idx) =>
			{
				const globalIndex = start + idx;
				return `${globalIndex}. (i: \`${globalIndex}\`) ${joke.replace(/\n/g, " ")}`;
			});

			embed.setDescription(descriptionLines.join("\n") || "(empty page?)");

			return embed;
		};

		const createButtons = (page) =>
		{
			return new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId("prev")
					.setLabel("◀")
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(page === 0),
				new ButtonBuilder()
					.setCustomId("next")
					.setLabel("▶")
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(page === totalPages - 1)
			);
		};

		await interaction.reply({
			embeds: [ generateEmbed(currentPage) ],
			components: [ createButtons(currentPage) ],
			flags: Flags.EPHEMERAL
		});

		const message = await interaction.fetchReply();

		const collector = message.createMessageComponentCollector({
			filter: i => i.user.id === interaction.user.id,
			time: 5 * 60 * 1000, // 5 minutes
			componentType: ComponentType.Button
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
				embeds: [ generateEmbed(currentPage) ],
				components: [ createButtons(currentPage) ]
			});
		});

		collector.on("end", async () =>
		{
			await interaction.editReply({
				components: [
					new ActionRowBuilder().addComponents(
						new ButtonBuilder()
							.setCustomId("prev")
							.setLabel("◀ Prev")
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(true),
						new ButtonBuilder()
							.setCustomId("next")
							.setLabel("Next ▶")
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(true)
					)
				]
			}).catch(() => {});
		});

		return;
	}

	return interaction.reply({
		content: "Unknown subcommand.",
		flags: Flags.EPHEMERAL
	});
}