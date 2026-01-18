import { AttachmentBuilder, SlashCommandBuilder } from "discord.js";
import axios from "axios";
import { Precondition } from "../../../plugins/preconditions/precondition.js";

export const data = new SlashCommandBuilder()
	.setName("meme")
	.setDescription("Generate a meme image with top and/or bottom text")
	.addAttachmentOption(option =>
		option
			.setName("img")
			.setDescription("The image to use as the meme template")
			.setRequired(true)
	)
	.addStringOption(option =>
		option
			.setName("toptext")
			.setDescription("Text to place at the top")
			.setRequired(true)
			.setMaxLength(1250)
	)
	.addStringOption(option =>
		option
			.setName("bottomtext")
			.setDescription("Text to place at the bottom")
			.setRequired(false)
			.setMaxLength(1250)
	)
	.addIntegerOption(option =>
		option
			.setName("fontsize")
			.setDescription("Font size (default: 32)")
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
		const toptext = interaction.options.getString("toptext") ?? "";
		const bottomtext = interaction.options.getString("bottomtext") ?? "";
		const fontSize = interaction.options.getInteger("fontsize") ?? 32;

		if (!img)
		{
			return interaction.editReply({ content: "Please provide an image." });
		}

		if (!toptext && !bottomtext)
		{
			return interaction.editReply({ content: "You must provide at least **toptext** or **bottomtext**." });
		}

		if (fontSize <= 0)
		{
			return interaction.editReply({ content: "Font size must be a positive number." });
		}

		const url = "https://castor_webserver.guiki.pt/fun/meme";

		const resp = await axios.post(
			url,
			{ img, toptext, bottomtext, fontsize: fontSize },
			{
				responseType: "arraybuffer",
				timeout: 60000,
				headers: {
					"JASPER-API-KEY": process.env.JASPER_API_KEY
				}
			}
		);

		const buffer = Buffer.from(resp.data);
		const attachment = new AttachmentBuilder(buffer, { name: "meme.png" });

		return interaction.editReply({ content: "-# Generated!", files: [ attachment ] });
	}
	catch (error)
	{
		console.error("meme command error:", error?.response?.data?.toString() ?? error);

		const replyContent = "Failed to generate meme image.";
		if (interaction.deferred || interaction.replied)
		{
			return interaction.editReply({ content: replyContent });
		}
		return interaction.reply({ content: replyContent, ephemeral: true });
	}
}