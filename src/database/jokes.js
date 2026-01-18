import fs from "node:fs";
import path from "node:path";

const FILE_PATH = "src/database/data/jokes.json";

const dataDir = path.dirname(FILE_PATH);
if (!fs.existsSync(dataDir))
{
	fs.mkdirSync(dataDir, { recursive: true });
}

let jokes = [];
if (fs.existsSync(FILE_PATH))
{
	try
	{
		const data = fs.readFileSync(FILE_PATH, "utf8");
		jokes = JSON.parse(data);
		if (!Array.isArray(jokes))
		{
			console.error("jokes.json is not an array - resetting to empty");
			jokes = [];
		}
	}
	catch (err)
	{
		console.error("Failed to load jokes.json:", err);
		jokes = [];
	}
}
else
{
	jokes = [
		"5 ants rented an apartment with another 5 ants. Now they’re tenants.",
		"What do you call cows on the peak of a mountain?\nThe stakes are high.",
		"Why shouldn't you write with a broken pencil?\nBecause it's pointless.",
		"What do you call a factory that makes okay products?\nA satisfactory.",
		"Why did the scarecrow win an award?\nBecause he was outstanding in his field.",
		"I would avoid the sushi if I was you. It’s a little fishy.",
		"Want to hear a joke about construction?\nI’m still working on it.",
		"I used to play piano by ear, but now I use my hands.",
		"Why did the bicycle fall over?\nBecause it was two-tired!",
		"What do you call fake spaghetti?\nAn impasta!",
		"Why shouldn't you trust trees?\nThey seem shady.",
		"Where do sheep go on vacation? The Baaaa-hamas.",
		"What did the tree say when spring finally arrived? What a re-leaf.",
		"I went to buy a pair of camouflage pants, but I couldn’t find any.",
		"Where do penguins go to vote? The North Poll.",
		"Why are libraries so tall? Because they have many stories.",
		"Why did the Energizer Bunny go to jail? He was charged with battery.",
		"I asked my dad to name two bodies of water, he said \"Well, damn!\""
	];
	saveJokes();
}

function saveJokes()
{
	try
	{
		fs.writeFileSync(FILE_PATH, JSON.stringify(jokes, null, 2), "utf8");
		console.log(`Saved ${jokes.length} jokes to ${FILE_PATH}`);
	}
	catch (err)
	{
		console.error("Failed to save jokes:", err);
	}
}

export function addJoke(newJoke)
{
	if (typeof newJoke !== "string" || newJoke.trim() === "") return false;
	const trimmed = newJoke.trim();
	jokes.push(trimmed);
	saveJokes();
	return true;
}

export function removeJoke(indexOrText)
{
	let removed = false;

	if (typeof indexOrText === "number")
	{
		if (indexOrText >= 0 && indexOrText < jokes.length)
		{
			jokes.splice(indexOrText, 1);
			removed = true;
		}
	}
	else if (typeof indexOrText === "string")
	{
		const before = jokes.length;
		jokes = jokes.filter(j => j !== indexOrText);
		removed = jokes.length < before;
	}

	if (removed)
	{
		saveJokes();
	}
	return removed;
}

export { jokes };