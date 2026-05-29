export const config = {
	developers: [ "302868099743612939" ] as string[],
	prefix: process.env.PREFIX || "c?",
	roles: {
		members: process.env.MEMBERS_ROLE_ID!
	},
	channels: {
		internalLog: process.env.ERROR_LOG_CHANNEL_ID!
	}
} as const; 