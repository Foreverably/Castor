import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("1234567890abcdef", 10);

const getUniqueRpsId = (client) =>
{
	const rpsGames = client.games.get("rps") || {};
	let uniqueId = nanoid();
	while (rpsGames[ uniqueId ])
	{
		uniqueId = nanoid();
	}

	return uniqueId;
};

const addRpsGameData = (
	client,
	uniqueId,
	userId,
	opponentId,
	isBot = false
) =>
{
	client.games.set("rps", {
		...client.games.get("rps"),
		[ uniqueId ]: {
			challenger: { userId, choice: null },
			opponent: { userId: opponentId, choice: null },
			uniqueId,
			createdAt: Date.now(),
			completedAt: null,
			winner: null,
			isBot
		}
	});
};

export {
	getUniqueRpsId,
	addRpsGameData
};