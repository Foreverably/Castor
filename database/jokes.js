import fs from "node:fs";
import path from "node:path";

const FILE_PATH = "database/data/jokes.json";

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
		{ setup: "5 ants rented an apartment with another 5 ants.", punchline: "Now they’re tenants." },
		{ setup: "What do you call cows on the peak of a mountain?", punchline: "The stakes are high." },
		{ setup: "Why shouldn't you write with a broken pencil?", punchline: "Because it's pointless." },
		{ setup: "What do you call a factory that makes okay products?", punchline: "A satisfactory." },
		{ setup: "Why did the scarecrow win an award?", punchline: "Because he was outstanding in his field." },
		{ setup: "I would avoid the sushi if I was you.", punchline: "It’s a little fishy." },
		{ setup: "Want to hear a joke about construction?", punchline: "I’m still working on it." },
		{ setup: "Why did the bicycle fall over?", punchline: "Because it was two-tired!" },
		{ setup: "What do you call fake spaghetti?", punchline: "An impasta!" },
		{ setup: "Why shouldn't you trust trees?", punchline: "They seem shady." },
		{ setup: "Where do sheep go on vacation?", punchline: "The Baaaa-hamas." },
		{ setup: "What did the tree say when spring finally arrived?", punchline: "What a re-leaf." }
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
	if (!newJoke || typeof newJoke !== 'object') return false;
	jokes.push({
		setup: newJoke.setup.trim(),
		punchline: newJoke.punchline.trim()
	});
	saveJokes();
	return true;
}

export function removeJoke(indexOrText)
{
	let removed = false;
	const before = jokes.length;
	if (typeof indexOrText === "number" && indexOrText >= 0 && indexOrText < jokes.length)
	{
		jokes.splice(indexOrText, 1);
		removed = true;
	}
	else if (typeof indexOrText === "string")
	{
		jokes = jokes.filter(j => j.setup !== indexOrText);
		removed = jokes.length < before;
	}
	if (removed) saveJokes();
	return removed;
}

export { jokes };