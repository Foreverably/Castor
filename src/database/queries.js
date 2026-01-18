import UserSchema from "./schemas/user.js";

export const fetchOrCreateUser = async (userId) =>
{
	const user = await UserSchema.findOne({ userId }).lean();

	if (user)
	{
		return user;
	}

	const newUser = new UserSchema({ userId });
	await newUser.save();
	return newUser;
};

export const updateUser = (userId, data) =>
{
	return UserSchema.findOneAndUpdate({ userId }, data, {
		upsert: true
	});
};

export const fetchGuildLeaderboard = async () =>
{
	return UserSchema.find({}).sort({ balance: -1 }).limit(10).lean();
};

export default {
	fetchOrCreateUser,
	updateUser,
	fetchGuildLeaderboard
};
