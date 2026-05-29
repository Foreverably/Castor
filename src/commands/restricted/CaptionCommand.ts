import {
    BaseSlashCommand,
    Builder,
    Interaction,
} from "@/structures/base/commands/BaseSlashCommand";
import { ExtendedClient } from "@/structures/Client";
import { CommandCategory } from "@/types/CommandCategories";
import { chromium } from "playwright-core";
import { MessageFlags } from "discord.js";

export default class CaptionCommand extends BaseSlashCommand
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            name: "caption",
            description: "Add a white caption box with text to the top of an image.",
            category: CommandCategory.FUN,
            cooldown: 5,
            usage: "/caption [image] [text] [gif]",
            constraints: {
                restrictedFunCommands: true,
            },
            permissions: [],
            construct: () =>
                new Builder<"SlashCommandBuilder">()
                    .setName("caption")
                    .setDescription("Add a white caption box with text to the top of an image.")
                    .addAttachmentOption((option) =>
                        option
                            .setName("image")
                            .setDescription("The image to caption.")
                            .setRequired(true),
                    )
                    .addStringOption((option) =>
                        option
                            .setName("text")
                            .setDescription("The caption text to place in the white box.")
                            .setRequired(true),
                    )
                    .addBooleanOption((option) =>
                        option
                            .setName("gif")
                            .setDescription(
                                "Format the output as a GIF so it can be favorited on Discord.",
                            )
                            .setRequired(false),
                    ),
        });
    }

    async execute(interaction: Interaction<"ChatInput">): Promise<void>
    {
        const browserWSEndpoint = process.env.BROWSER_WS_ENDPOINT;

        if (!browserWSEndpoint)
        {
            await interaction.reply({
                content: "❌ Error: BROWSER_WS_ENDPOINT environment variable is not set.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const attachment = interaction.options.getAttachment("image", true);
        const captionText = interaction.options.getString("text", true);
        const asGif = interaction.options.getBoolean("gif") ?? false;

        if (!attachment.contentType?.startsWith("image/"))
        {
            await interaction.reply({
                content: "Error: Please upload a valid image file.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.deferReply();

        try
        {
            const response = await fetch(attachment.url);
            if (!response.ok) throw new Error("Could not download the uploaded image.");

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Data = buffer.toString("base64");
            const dataUrl = `data:${attachment.contentType};base64,${base64Data}`;

            const w = attachment.width || 800;
            const h = attachment.height || 600;

            const browser = await chromium.connectOverCDP(browserWSEndpoint, {
                timeout: 15000,
            });
            const context = await browser.newContext();
            const page = await context.newPage();

            await page.setViewportSize({ width: w, height: h + 400 });

            const escapedText = captionText
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");

            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@700&display=swap');

                    html, body {
                        margin: 0;
                        padding: 0;
                        background: white;
                        overflow: hidden;
                        width: ${w}px;
                    }
                    .meme-container {
                        display: flex;
                        flex-direction: column;
                        width: ${w}px;
                        background: white;
                    }
                    .caption-box {
                        background: white;
                        color: black;
                        font-family: "Oswald", "Futura", "Helvetica Neue", "Helvetica", "Arial", sans-serif;
                        font-weight: 700;
                        font-size: ${Math.max(20, Math.floor(w * 0.07))}px;
                        text-align: center;
                        padding: ${Math.max(12, Math.floor(w * 0.05))}px ${Math.max(16, Math.floor(w * 0.06))}px;
                        word-wrap: break-word;
                        line-height: 1.15;
                    }
                    .base-image {
                        width: 100%;
                        display: block;
                    }
                </style>
                </head>
                <body>
                    <div class="meme-container">
                        <div class="caption-box">${escapedText}</div>
                        <img class="base-image" src="${dataUrl}" />
                    </div>
                </body>
                </html>
            `;

            await page.setContent(htmlContent);

            await page.waitForSelector(".base-image");

            const totalHeight = await page.$eval(
                ".meme-container",
                (el) => el.getBoundingClientRect().height,
            );

            await page.setViewportSize({ width: w, height: Math.ceil(totalHeight) });

            const screenshot = await page.screenshot({
                type: "png",
            });

            await context.close();
            await browser.close();

            let outputBuffer = screenshot;
            let outputName = "caption.png";

            if (asGif)
            {
                try
                {
                    const sharp = (await import("sharp")).default;
                    outputBuffer = await sharp(screenshot).gif().toBuffer();
                    outputName = "caption.gif";
                }
                catch (error)
                {
                    this.client.logger.warn(
                        "[CaptionCommand] 'sharp' library is not installed. Defaulting output to PNG. To enable GIF output, run 'npm install sharp'.",
                    );
                }
            }

            await interaction.editReply({
                content: null,
                files: [
                    {
                        attachment: outputBuffer,
                        name: outputName,
                    },
                ],
            });
        }
        catch (error)
        {
            this.client.logger.error("Caption command error:", error);
            await interaction
                .editReply({
                    content: "❌ Error: Failed to generate captioned image.",
                })
                .catch(() =>
                {});
        }
    }
}
