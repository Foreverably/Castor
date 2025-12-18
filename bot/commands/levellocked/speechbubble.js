import { AttachmentBuilder, SlashCommandBuilder } from "discord.js";
import axios from "axios";
import { Precondition } from "../../../plugins/preconditions/precondition.js";

export const data = new SlashCommandBuilder()
	.setName("speechbubble")
	.setDescription("Add a speech bubble (top or bottom) to an image")
	.addAttachmentOption(option =>
		option
			.setName("img")
			.setDescription("The image to add a speech bubble to")
			.setRequired(true)
	)
	.addStringOption(option =>
		option
			.setName("position")
			.setDescription("Where to place the speech bubble")
			.setRequired(true)
			.addChoices(
				{ name: "Top", value: "top" },
				{ name: "Bottom", value: "bottom" }
			)
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
		const position = interaction.options.getString("position");

		if (!img)
		{
			return interaction.editReply({ content: "Please attach an image." });
		}

		if (!position)
		{
			return interaction.editReply({ content: "Please select a position (top or bottom)." });
		}

		const url = "https://castor_webserver.guiki.pt/fun/speechbubble";

		const resp = await axios.post(
			url,
			{ img, position },
			{
				responseType: "arraybuffer",
				timeout: 20000,
				headers: {
					"JASPER-API-KEY": process.env.JASPER_API_KEY
				}
			}
		);

		const buffer = Buffer.from(resp.data);
		const attachment = new AttachmentBuilder(buffer, { name: "speechbubble.png" });

		return interaction.editReply({ content: "-# Generated!", files: [ attachment ] });
	}
	catch (error)
	{
		console.error("speechbubble command error:", error?.response?.data?.toString() ?? error);

		const replyContent = "Failed to generate speech bubble image.";
		if (interaction.deferred || interaction.replied)
		{
			return interaction.editReply({ content: replyContent });
		}
		return interaction.reply({ content: replyContent, ephemeral: true });
	}
}