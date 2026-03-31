import { SlashCommandBuilder } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { Category } from "../../../common/command/enums.js";

const JOKES_PATH = path.join(process.cwd(), "src/database/data/jokes.json");

function getRandomJoke()
{
	if (!fs.existsSync(JOKES_PATH))
	{
		return "No jokes available... someone ate the dad-joke book! 😭";
	}

	try
	{
		const data = fs.readFileSync(JOKES_PATH, "utf8");
		const jokes = JSON.parse(data);

		if (!Array.isArray(jokes) || jokes.length === 0)
		{
			return "The joke vault is empty... send help!";
		}

		const joke = jokes[ Math.floor(Math.random() * jokes.length) ];
		return joke;
	}
	catch (err)
	{
		console.error("Failed to read/load jokes.json:", err);
		return "Error loading dad jokes... blame the file gremlins!";
	}
}

/** @type {import("../../../common/schema.js").CommandData} */
export const data = {
	name: "dadjoke",
	description: "We love dad jokes!",
	category: Category.RESTRICTED,
	constraints: {
		hasFunCommands: true
	},
	options: new SlashCommandBuilder(),
	async execute(interaction)
	{
		const joke = getRandomJoke();
		if (typeof joke === "string")
		{
			await interaction.reply({ content: joke, ephemeral: true });
			return;
		}
		const setupText = joke.setup || joke.question;
		const punchlineText = joke.punchline || joke.answer;

		if (!setupText || !punchlineText)
		{
			console.error("Joke object is missing keys:", joke);
			await interaction.reply({
				content: "Error: This joke is formatted incorrectly in the database.",
				ephemeral: true
			});
			return;
		}

		await interaction.reply(`${setupText}`);
		const filter = (m) => m.author.id === interaction.user.id;

		try
		{
			await interaction.channel.awaitMessages({
				filter,
				max: 1,
				time: 30000,
				errors: [ "time" ]
			});

			await interaction.followUp(`**${punchlineText}**`);
		}
		catch
		{
			await interaction.followUp(
				`Too slow! The answer was: **${punchlineText}**`
			);
		}
	}
};
