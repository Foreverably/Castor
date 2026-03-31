import { AttachmentBuilder, SlashCommandBuilder } from "discord.js";
import { Category } from "../../../common/command/enums.js";

/** @type {import("../../../common/schema.js").CommandData} */
export const data = {
	name: "caption",
	description: "Generate a captioned image (top or bottom)",
	category: Category.RESTRICTED,
	constraints: {
		hasFunCommands: true
	},
	options: new SlashCommandBuilder()
		.addAttachmentOption((option) =>
			option
				.setName("img")
				.setDescription("Attach an image to caption")
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("text")
				.setDescription("Caption text")
				.setRequired(true)
				.setMaxLength(1250),
		)
		.addStringOption((option) =>
			option
				.setName("position")
				.setDescription("Position of caption: top or bottom")
				.setRequired(true)
				.addChoices(
					{ name: "Top", value: "top" },
					{ name: "Bottom", value: "bottom" },
				),
		)
		.addIntegerOption((option) =>
			option
				.setName("fontsize")
				.setDescription("Font size (default: 72)")
				.setRequired(false)
				.setMinValue(1),
		),
	async execute(interaction) 
	{
		try 
		{
			await interaction.reply({ content: "Generating caption image..." });

			const imgAttachment = interaction.options.getAttachment("img");
			const img = imgAttachment?.url;
			const text = interaction.options.getString("text");
			let position = interaction.options.getString("position");
			let fontSize = interaction.options.getInteger("fontsize") ?? 72;

			if (!img || !text || !position) 
			{
				return interaction.editReply({ content: "Missing required options." });
			}

			if (fontSize <= 0) 
			{
				fontSize = 72;
			}

			const url = "https://castor_webserver.guiki.pt/fun/caption";
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 60000);
			let buffer;
			try {
				const resp = await fetch(url, {
					method: 'POST',
					signal: controller.signal,
					headers: {
						'Content-Type': 'application/json',
						'JASPER-API-KEY': process.env.JASPER_API_KEY,
					},
					body: JSON.stringify({img, text, position, fontsize: fontSize}),
				});
				if (!resp.ok) {
					throw new Error(`API Error: ${resp.status} ${resp.statusText}`);
				}
				const arrayBuffer = await resp.arrayBuffer();
				buffer = Buffer.from(arrayBuffer);
			} finally {
				clearTimeout(timeoutId);
			}
			const attachment = new AttachmentBuilder(buffer, { name: "caption.png" });

			return interaction.editReply({
				content: "-# Generated!",
				files: [attachment],
			});
		}
		catch (error) 
		{
			console.error(
				"caption command error:",
				error?.message || error
			);

			const replyContent = "Failed to generate caption image.";
			if (interaction.deferred || interaction.replied) 
			{
				return interaction.editReply({ content: replyContent });
			}
			return interaction.reply({ content: replyContent, ephemeral: true });
		}
	},
};
