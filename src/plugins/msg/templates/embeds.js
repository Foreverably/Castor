/**
 * Creates a minimal embed object compatible with discord.js Reply payloads.
 * Accepts an options object: { title, description, color, author, footer, timestamp, fields }
 * @param {Object} options - Options for the embed
 * @return {Object} embed object
 */
export function basicEmbed(options = {})
{
	const embed = {};
	if (options.title) embed.title = options.title;
	if (options.description) embed.description = options.description;
	if (options.color !== undefined) embed.color = typeof options.color === "number" ? options.color : parseInt(options.color, 16);
	if (options.author)
	{
		embed.author = {
			name: options.author.name ?? "",
			icon_url: options.author.iconURL ?? options.author.icon_url ?? undefined,
			url: options.author.url ?? undefined
		};
	}
	if (options.thumbnail) embed.thumbnail = { url: options.thumbnail };
	if (options.image) embed.image = { url: options.image };
	if (options.footer)
	{
		embed.footer = {
			text: options.footer.text ?? "",
			icon_url: options.footer.iconURL ?? options.footer.icon_url ?? undefined
		};
	}
	if (options.timestamp) embed.timestamp = new Date(options.timestamp).toISOString();
	if (options.fields) embed.fields = options.fields;
	return embed;
}

