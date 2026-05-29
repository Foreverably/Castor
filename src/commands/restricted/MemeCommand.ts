import {
    BaseSlashCommand,
    Builder,
    Interaction,
} from "@/structures/base/commands/BaseSlashCommand";
import { ExtendedClient } from "@/structures/Client";
import { CommandCategory } from "@/types/CommandCategories";
import { chromium } from "playwright-core";
import { MessageFlags } from "discord.js";

export default class MemeCommand extends BaseSlashCommand
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            name: "meme",
            description: "Overlay classic Impact meme text at the top and bottom of an image.",
            category: CommandCategory.FUN,
            cooldown: 5,
            constraints: {
                restrictedFunCommands: true,
            },
            usage: "/meme [image] [top] [bottom] [gif]",
            permissions: [],
            construct: () =>
                new Builder<"SlashCommandBuilder">()
                    .setName("meme")
                    .setDescription(
                        "Overlay classic Impact meme text at the top and bottom of an image.",
                    )
                    .addAttachmentOption((option) =>
                        option
                            .setName("image")
                            .setDescription("The image to overlay the text onto.")
                            .setRequired(true),
                    )
                    .addStringOption((option) =>
                        option
                            .setName("top")
                            .setDescription("Text to place at the top.")
                            .setRequired(false),
                    )
                    .addStringOption((option) =>
                        option
                            .setName("bottom")
                            .setDescription("Text to place at the bottom.")
                            .setRequired(false),
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
        const topText = interaction.options.getString("top") ?? "";
        const bottomText = interaction.options.getString("bottom") ?? "";
        const asGif = interaction.options.getBoolean("gif") ?? false;

        if (!attachment.contentType?.startsWith("image/"))
        {
            await interaction.reply({
                content: "Error: Please upload a valid image file.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        if (!topText && !bottomText)
        {
            await interaction.reply({
                content: "❌ Error: Please provide at least one text parameter (top or bottom).",
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

            await page.setViewportSize({ width: w, height: h });

            const escapeHtml = (text: string): string =>
                text
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;");

            const escapedTop = escapeHtml(topText);
            const escapedBottom = escapeHtml(bottomText);

            const topHtml = escapedTop ? `<div class="meme-text top-text">${escapedTop}</div>` : "";
            const bottomHtml = escapedBottom
                ? `<div class="meme-text bottom-text">${escapedBottom}</div>`
                : "";

            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                <style>
                    html, body {
                        margin: 0;
                        padding: 0;
                        background: transparent;
                        overflow: hidden;
                        width: ${w}px;
                        height: ${h}px;
                    }
                    .container {
                        position: relative;
                        width: 100%;
                        height: 100%;
                    }
                    .base-image {
                        width: 100%;
                        height: 100%;
                        object-fit: fill;
                    }
                    .meme-text {
                        position: absolute;
                        left: 5%;
                        right: 5%;
                        text-align: center;
                        color: white;
                        font-family: "Impact";
                        font-weight: 900;
                        text-transform: uppercase;
                        font-size: ${Math.max(22, Math.floor(h * 0.09))}px;
                        line-height: 1.1;
                        word-wrap: break-word;
                        text-shadow:
                            -0.05em -0.05em 0 #000,  0.05em -0.05em 0 #000, 
                            -0.05em  0.05em 0 #000,  0.05em  0.05em 0 #000,
                             0px    -0.05em 0 #000,  0px     0.05em 0 #000, 
                            -0.05em  0px    0 #000,  0.05em  0px    0 #000,
                            -0.03em -0.03em 0 #000,  0.03em -0.03em 0 #000, 
                            -0.03em  0.03em 0 #000,  0.03em  0.03em 0 #000,
                            -0.06em -0.06em 0 #000,  0.06em -0.06em 0 #000, 
                            -0.06em  0.06em 0 #000,  0.06em  0.06em 0 #000;
                    }
                    .top-text {
                        top: ${Math.max(10, Math.floor(h * 0.03))}px;
                    }
                    .bottom-text {
                        bottom: ${Math.max(10, Math.floor(h * 0.03))}px;
                    }
                </style>
                </head>
                <body>
                    <div class="container">
                        <img class="base-image" src="${dataUrl}" />
                        ${topHtml}
                        ${bottomHtml}
                    </div>
                </body>
                </html>
            `;

            await page.setContent(htmlContent);

            const screenshot = await page.screenshot({
                type: "png",
            });

            await context.close();
            await browser.close();

            let outputBuffer = screenshot;
            let outputName = "meme.png";

            if (asGif)
            {
                try
                {
                    const sharp = (await import("sharp")).default;
                    outputBuffer = await sharp(screenshot).gif().toBuffer();
                    outputName = "meme.gif";
                }
                catch (error)
                {
                    this.client.logger.warn(
                        "[MemeCommand] 'sharp' library is not installed. Defaulting output to PNG. To enable GIF output, run 'npm install sharp'.",
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
            this.client.logger.error("Meme overlay error:", error);
            await interaction
                .editReply({
                    content: "❌ Error: Failed to generate meme image.",
                })
                .catch(() =>
                {});
        }
    }
}
