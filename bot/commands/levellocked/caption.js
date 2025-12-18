import { AttachmentBuilder, SlashCommandBuilder } from "discord.js";
import axios from "axios";
import { Precondition } from "../../../plugins/preconditions/precondition.js";

export const data = new SlashCommandBuilder()
	.setName("caption")
	.setDescription("Generate a captioned image (top or bottom)")
	.addAttachmentOption(option =>
		option
			.setName("img")
			.setDescription("Attach an image to caption")
			.setRequired(true)
	)
	.addStringOption(option =>
		option
			.setName("text")
			.setDescription("Caption text")
			.setRequired(true)
			.setMaxLength(1250)
	)
	.addStringOption(option =>
		option
			.setName("position")
			.setDescription("Position of caption: top or bottom")
			.setRequired(true)
			.addChoices(
				{ name: "Top", value: "top" },
				{ name: "Bottom", value: "bottom" }
			)
	)
	.addIntegerOption(option =>
		option
			.setName("fontsize")
			.setDescription("Font size (default: 72)")
			.setRequired(false)
			.setMinValue(1)
	);

export async function execute(interaction)
{
	if (!Precondition.check.hasFunCommandAccess(interaction))
	{
		return Precondition.result.denied(interaction);
	}

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

		if (fontSize <= 0) fontSize = 72;

		const url = "https://castor_webserver.guiki.pt/fun/caption";

		const resp = await axios.post(
			url,
			{ img, text, position, fontsize: fontSize },
			{
				responseType: "arraybuffer",
				timeout: 60000,
				headers: {
					"JASPER-API-KEY": process.env.JASPER_API_KEY
				}
			}
		);

		const buffer = Buffer.from(resp.data);
		const attachment = new AttachmentBuilder(buffer, { name: "caption.png" });

		return interaction.editReply({ content: "-# Generated!", files: [ attachment ] });
	}
	catch (error)
	{
		console.error("caption command error:", error?.response?.data?.toString() ?? error);

		const replyContent = "Failed to generate caption image.";
		if (interaction.deferred || interaction.replied)
		{
			return interaction.editReply({ content: replyContent });
		}
		return interaction.reply({ content: replyContent, ephemeral: true });
	}
}