import { SlashCommandBuilder } from "discord.js";
import { Precondition } from "../../../plugins/preconditions/precondition.js";
import fs from "node:fs";
import path from "node:path";

const JOKES_PATH = path.join(process.cwd(), "database/data/jokes.json");

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

export const data = new SlashCommandBuilder()
	.setName("dadjoke")
	.setDescription("We love dad jokes!");

export async function execute(interaction)
{
	if (!Precondition.check.hasFunCommandAccess(interaction))
	{
		return Precondition.result.denied(interaction);
	}

	const joke = getRandomJoke();

	await interaction.reply({
		content: joke,
		allowedMentions: { parse: [] }
	});
}