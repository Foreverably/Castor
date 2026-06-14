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
import {
    ApplicationCommandType,
    AttachmentBuilder,
    ContextMenuCommandBuilder,
    MessageFlags,
} from "discord.js";
import { chromium } from "playwright-core";

@Category(CommandCategory.FUN)
@RestrictedFunCommands()
export default class MakeItAQuoteMessageContextCommand extends BaseSlashCommand
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            name: "Make it a Quote",
            description: "Create a visual quote from a user's message.",
            cooldown: 5,
            usage: "Right-click message -> Apps -> Make it a Quote",
            construct: () =>
                new ContextMenuCommandBuilder()
                    .setName("Make it a Quote")
                    .setType(ApplicationCommandType.Message),
        });
    }

    private generateQuoteHtml(
        username: string,
        quoteText: string,
        avatarURL: string,
        quoteFontSize: number,
    ): string
    {
        const safeQuote = quoteText
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        const safeUser = username
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        const style = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;700&display=swap');
                
                body { 
                    width: 1000px;
                    height: 500px; 
                    margin: 0; 
                    background-color: #000000;
                    position: relative; 
                    overflow: hidden;
                }
                
                .pfp-image {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 500px; 
                    height: 500px;
                    background-image: url('${avatarURL}'); 
                    background-size: cover;
                    background-position: center;
                    filter: brightness(0.8) grayscale(100%); 
                }
                
                .gradient-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(to right, 
                        rgba(0, 0, 0, 0) 0%, 
                        rgba(0, 0, 0, 0.4) 15%, 
                        #000000 50%, 
                        #000000 100%
                    );
                }

                .text-container {
                    position: absolute;
                    top: 0;
                    right: 0; 
                    width: 500px; 
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: center; 
                    align-items: center; 
                    text-align: center;
                    padding: 0; 
                    z-index: 5; 
                }

                .quote-text {
                    font-family: 'Roboto', sans-serif;
                    font-weight: 600;
                    font-size: ${quoteFontSize}px; 
                    color: #ffffff;
                    line-height: 1.3;
                    max-width: 400px;
                    margin: 0;
                    text-align: center;
                    text-shadow: 0 0 5px rgba(0, 0, 0, 0.5); 
                }
                .author {
                    font-family: 'Roboto', sans-serif;
                    font-weight: 300;
                    font-size: 26px; 
                    color: #a0a0a0;
                    margin-top: 20px;
                    text-align: center;
                }
                .credit {
                    position: absolute;
                    bottom: 10px;
                    right: 10px;
                    font-size: 14px;
                    color: #444444; 
                    z-index: 10;
                }
            </style>
        `;

        return `
            <!DOCTYPE html>
            <html>
                <head>
                    ${style}
                </head>
                <body>
                    <div class="pfp-image"></div>
                    <div class="gradient-overlay"></div>
                    <div class="text-container">
                        <div class="quote-text">
                            ${safeQuote}
                        </div>
                        <div class="author">
                            — ${safeUser}
                        </div>
                    </div>
                    <div class="credit">Make it a Quote via Castor</div>
                </body>
            </html>
        `;
    }

    private async renderRawHtml(
        htmlContent: string,
        width: number,
        height: number,
    ): Promise<Buffer>
    {
        const browserWSEndpoint = process.env.BROWSER_WS_ENDPOINT;
        if (!browserWSEndpoint)
        {
            throw new Error("BROWSER_WS_ENDPOINT environment variable is not set.");
        }

        const browser = await chromium.connectOverCDP(browserWSEndpoint, {
            timeout: 15000,
        });
        try
        {
            const context = await browser.newContext();
            const page = await context.newPage();
            await page.setViewportSize({ width, height });
            await page.setContent(htmlContent);
            const screenshot = await page.screenshot({ type: "png" });
            await context.close();
            return screenshot;
        }
        finally
        {
            await browser.close();
        }
    }

    async execute(interaction: any): Promise<void>
    {
        if (!interaction.isMessageContextMenuCommand())
        {
            return;
        }

        const targetMessage = interaction.targetMessage;
        const quoteText = targetMessage.content;

        if (targetMessage.author.bot || !quoteText.trim())
        {
            await interaction.reply({
                content: "Cannot quote bots or empty messages!",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.deferReply();

        const timeout = setTimeout(() =>
        {
            if (interaction.replied || interaction.deferred)
            {
                interaction
                    .editReply({
                        content: "Quote generation timed out after 12 seconds.",
                    })
                    .catch(() =>
                    {});
            }
        }, 12_000);

        try
        {
            let quoteFontSize = 46;
            const length = quoteText.length;

            if (length > 200)
            {
                quoteFontSize = 26;
            }
            else if (length > 100)
            {
                quoteFontSize = 34;
            }

            const avatarURL = (targetMessage.member || targetMessage.author).displayAvatarURL({
                size: 512,
                extension: "png",
                forceStatic: true,
            });

            const htmlContent = this.generateQuoteHtml(
                targetMessage.author.username,
                quoteText,
                avatarURL,
                quoteFontSize,
            );

            const imageBuffer = await this.renderRawHtml(htmlContent, 1000, 500);

            const attachment = new AttachmentBuilder(imageBuffer, { name: "quote.png" });

            await interaction.editReply({
                content: `-# **Quote by ${targetMessage.author} generated:**`,
                files: [attachment],
                allowedMentions: { parse: [] },
            });
        }
        catch (error: any)
        {
            this.client.logger.error("Quote command error:", error);

            let message = "Failed to create quote image.";
            if (error.name === "AbortError")
            {
                message = "Avatar download timed out.";
            }
            await interaction
                .editReply({
                    content: message,
                })
                .catch(() =>
                {});
        }
        finally
        {
            clearTimeout(timeout);
        }
    }
}
