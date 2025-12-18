// web/messageBuilder.mjs
/**
 * @typedef {Object} EmbedAuthor
 * @property {string} [name]
 * @property {string} [iconURL]
 * @property {string} [url]
 */

/**
 * @typedef {Object} EmbedFooter
 * @property {string} text
 * @property {string} [iconURL]
 */

/**
 * @typedef {Object} EmbedField
 * @property {string} name
 * @property {string} value
 * @property {boolean} [inline]
 */

/**
 * @typedef {Object} EmbedOptions
 * @property {string} [title]
 * @property {string} [description]
 * @property {string|number} [color]
 * @property {EmbedAuthor} [author]
 * @property {string} [thumbnail]
 * @property {string} [image]
 * @property {EmbedFooter} [footer]
 * @property {Date|string|number} [timestamp]
 * @property {EmbedField[]} [fields]
 */

/**
 * Creates a minimal message object that the renderer understands.
 */
export function createSimpleMessage(authorName, avatarUrl, isBot = false, content = '', roleColor = '') {
	return {
		author: authorName,
		avatar: avatarUrl,
		bot: isBot,
		content,
		roleColor,
		embeds: [],
		components: [],
	};
}

/**
 * Appends an embed to a message object.
 */
export function addEmbedToMessage(message, embedOptions) {
	let color = embedOptions.color;
	if (typeof color === 'number') {
		color = '#' + color.toString(16).padStart(6, '0').toUpperCase();
	}

	const embed = {
		title: embedOptions.title ?? '',
		description: embedOptions.description ?? '',
		color: color ?? '#0099ff',
		author: embedOptions.author
			? {
				name: embedOptions.author.name ?? '',
				iconURL: embedOptions.author.iconURL ?? '',
				url: embedOptions.author.url ?? '',
			}
			: undefined,
		thumbnail: embedOptions.thumbnail ? { url: embedOptions.thumbnail } : undefined,
		image: embedOptions.image ? { url: embedOptions.image } : undefined,
		footer: embedOptions.footer
			? {
				text: embedOptions.footer.text ?? '',
				iconURL: embedOptions.footer.iconURL ?? '',
			}
			: undefined,
		timestamp: embedOptions.timestamp
			? new Date(embedOptions.timestamp).toISOString()
			: undefined,
		fields: embedOptions.fields ?? [],
	};

	Object.keys(embed).forEach((k) => embed[k] === undefined && delete embed[k]);

	message.embeds = message.embeds ?? [];
	message.embeds.push(embed);
	return message;
}

/**
 * Adds a component action-row.
 */
export function addComponentRowToMessage(message, components) {
	message.components = message.components ?? [];
	message.components.push({
		type: 1,
		components,
	});
	return message;
}

/**
 * Converts a Discord.js Message (or JSON) into renderer-compatible format.
 *
 * Handles:
 * - User attachments (images → embed image)
 * - Link embeds
 * - Text + image + embed
 * - Image-only messages
 */
export function buildMessagesFromDiscord(messageData) {
	const avatar = messageData.author?.avatarURL
		? messageData.author.avatarURL
		: `https://cdn.discordapp.com/embed/avatars/0.png`;

	const msg = createSimpleMessage(
		messageData.author?.username || 'Unknown User',
		avatar,
		!!messageData.author?.bot,
		messageData.content ?? '',
		messageData.author?.roleColor ?? ''
	);

	// === 1. Handle Attachments (User-uploaded images) ===
	if (messageData.attachments && messageData.attachments.length > 0) {
		const imageAttachments = messageData.attachments.filter(
			(a) => a.width && a.height && a.content_type?.startsWith('image/')
		);

		if (imageAttachments.length > 0) {
			// Use first image as main embed image
			const mainImage = imageAttachments[0];
			addEmbedToMessage(msg, {
				image: mainImage.url,
				// Optional: add caption if no content
				description: msg.content || undefined,
			});
			// Clear content if it's just the image
			if (!msg.content.trim()) {
				msg.content = '';
			}
		}
	}

	// === 2. Handle Existing Embeds (link previews, bot embeds) ===
	if (Array.isArray(messageData.embeds) && messageData.embeds.length > 0) {
		messageData.embeds.forEach((raw) => {
			const embed = {
				title: raw.title ?? '',
				description: raw.description ?? '',
				color: raw.color ? '#' + raw.color.toString(16).padStart(6, '0').toUpperCase() : undefined,
				author: raw.author
					? {
						name: raw.author.name ?? '',
						iconURL: raw.author.iconURL ?? '',
						url: raw.author.url ?? '',
					}
					: undefined,
				thumbnail: raw.thumbnail?.url ? { url: raw.thumbnail.url } : undefined,
				image: raw.image?.url ? { url: raw.image.url } : undefined,
				footer: raw.footer
					? {
						text: raw.footer.text ?? '',
						iconURL: raw.footer.iconURL ?? '',
					}
					: undefined,
				timestamp: raw.timestamp ? new Date(raw.timestamp).toISOString() : undefined,
				fields: raw.fields ?? [],
			};
			Object.keys(embed).forEach((k) => embed[k] === undefined && delete embed[k]);
			msg.embeds.push(embed);
		});
	}

	// === 3. Handle Components ===
	if (Array.isArray(messageData.components) && messageData.components.length > 0) {
		messageData.components.forEach((row) => {
			if (row.type !== 1) return;
			msg.components.push({
				type: 1,
				components: row.components.map((c) => ({
					type: c.type,
					style: c.style,
					label: c.label,
					custom_id: c.custom_id,
					url: c.url,
					disabled: c.disabled,
					emoji: c.emoji ? { name: c.emoji.name, id: c.emoji.id } : undefined,
				})),
			});
		});
	}

	// === 4. Fallback: Image-only message with no content/embeds ===
	if (
		msg.embeds.length === 0 &
		messageData.attachments &&
		messageData.attachments.length > 0
	) {
		const firstImage = messageData.attachments.find(
			(a) => a.width && a.height && a.content_type?.startsWith('image/')
		);
		if (firstImage) {
			addEmbedToMessage(msg, { image: firstImage.url });
		}
	}

	return [msg];
}