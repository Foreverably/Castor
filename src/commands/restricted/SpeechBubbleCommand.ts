import {
    BaseSlashCommand,
    Builder,
    Interaction,
} from "@/structures/base/commands/BaseSlashCommand";
import {
    Category,
    RestrictedFunCommands,
} from "@/structures/base/commands/CommandDecorators";
import { ExtendedClient } from "@/structures/Client";
import { CommandCategory } from "@/types/CommandCategories";
import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";
import { MessageFlags } from "discord.js";

@Category(CommandCategory.FUN)
@RestrictedFunCommands()
export default class SpeechBubbleCommand extends BaseSlashCommand
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            name: "speechbubble",
            description: "Put a speech bubble overlay on top of an image.",
            cooldown: 5,
            usage: "/speechbubble [image] [transparent] [flip] [gif]",
            construct: () =>
                new Builder<"SlashCommandBuilder">()
                    .setName("speechbubble")
                    .setDescription("Put a speech bubble overlay on top of an image.")
                    .addAttachmentOption((option) =>
                        option
                            .setName("image")
                            .setDescription("The image to overlay the speech bubble onto.")
                            .setRequired(true),
                    )
                    .addBooleanOption((option) =>
                        option
                            .setName("transparent")
                            .setDescription(
                                "Carve out the speech bubble shape to make it transparent, keeping the rest of the image.",
                            )
                            .setRequired(false),
                    )
                    .addBooleanOption((option) =>
                        option
                            .setName("flip")
                            .setDescription("Flip the speech bubble horizontally on the Y-axis.")
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
        const transparent = interaction.options.getBoolean("transparent") ?? false;
        const flip = interaction.options.getBoolean("flip") ?? false;
        const asGif = interaction.options.getBoolean("gif") ?? false;

        if (!attachment.contentType?.startsWith("image/"))
        {
            await interaction.reply({
                content: "Error: Please upload a valid image file.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        let speechBubblePath = path.resolve(
            process.cwd(),
            "src/utils/web/speechbubble/speechbubble.png",
        );
        if (!fs.existsSync(speechBubblePath))
        {
            speechBubblePath = path.resolve(
                process.cwd(),
                "utils/web/speechbubble/speechbubble.png",
            );
        }

        if (!fs.existsSync(speechBubblePath))
        {
            await interaction.reply({
                content: "Error: Could not locate the speechbubble.png file",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.deferReply();

        try
        {
            const speechBubbleBuffer = fs.readFileSync(speechBubblePath);
            const speechBubbleBase64 = speechBubbleBuffer.toString("base64");
            const speechBubbleDataUrl = `data:image/png;base64,${speechBubbleBase64}`;

            const response = await fetch(attachment.url);
            if (!response.ok) throw new Error("Could not download the uploaded image.");

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Data = buffer.toString("base64");
            const dataUrl = `data:${attachment.contentType};base64,${base64Data}`;

            const w = attachment.width || 800;
            const h = attachment.height || 600;

            const bubbleHeight = Math.min(144, Math.max(50, Math.floor(h * 0.15)));

            const browser = await chromium.connectOverCDP(browserWSEndpoint, {
                timeout: 15000,
            });
            const context = await browser.newContext();
            const page = await context.newPage();

            await page.setViewportSize({ width: w, height: h });

            let wrapperStyles = "";
            let imageStyles = "";
            let overlayHtml = "";

            if (transparent)
            {
                wrapperStyles = `
                    -webkit-mask-image: 
                        url(${speechBubbleDataUrl}), 
                        linear-gradient(to bottom, white, white);
                    -webkit-mask-position: 
                        top center, 
                        left top;
                    -webkit-mask-size: 
                        100% ${bubbleHeight}px, 
                        100% 100%;
                    -webkit-mask-repeat: 
                        no-repeat, 
                        no-repeat;
                    -webkit-mask-composite: destination-out;
                    
                    mask-image: 
                        url(${speechBubbleDataUrl}), 
                        linear-gradient(to bottom, white, white);
                    mask-position: 
                        top center, 
                        left top;
                    mask-size: 
                        100% ${bubbleHeight}px, 
                        100% 100%;
                    mask-repeat: 
                        no-repeat, 
                        no-repeat;
                    mask-composite: exclude;
                `;

                if (flip)
                {
                    wrapperStyles += "transform: scaleX(-1);";
                    imageStyles += "transform: scaleX(-1);";
                }
            }
            else
            {
                overlayHtml = `
                    <img class="bubble-overlay" src="${speechBubbleDataUrl}" />
                `;
            }

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
                    .image-wrapper {
                        width: 100%;
                        height: 100%;
                        position: relative;
                        ${wrapperStyles}
                    }
                    .base-image {
                        width: 100%;
                        height: 100%;
                        object-fit: fill;
                        ${imageStyles}
                    }
                    .bubble-overlay {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: ${bubbleHeight}px;
                        object-fit: fill;
                        ${flip ? "transform: scaleX(-1);" : ""}
                    }
                </style>
                </head>
                <body>
                    <div class="container">
                        <div class="image-wrapper">
                            <img class="base-image" src="${dataUrl}" />
                        </div>
                        ${overlayHtml}
                    </div>
                </body>
                </html>
            `;

            await page.setContent(htmlContent);

            const screenshot = await page.screenshot({
                type: "png",
                omitBackground: transparent,
            });

            await context.close();
            await browser.close();

            let outputBuffer = screenshot;
            let outputName = "speechbubble.png";

            if (asGif)
            {
                try
                {
                    const sharp = (await import("sharp")).default;
                    outputBuffer = await sharp(screenshot).gif().toBuffer();
                    outputName = "speechbubble.gif";
                }
                catch (error)
                {
                    this.client.logger.warn(
                        "[SpeechBubbleCommand] 'sharp' library is not installed. Defaulting output to PNG. To enable GIF output, run 'npm install sharp'.",
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
            this.client.logger.error("Speech bubble overlay error:", error);
            await interaction
                .editReply({
                    content: "❌ Error: Failed to generate overlaid image.",
                })
                .catch(() =>
                {});
        }
    }
}
