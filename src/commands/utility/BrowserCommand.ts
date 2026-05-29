import { ExtendedClient } from "@/structures/Client";
import { CommandCategory } from "@/types/CommandCategories";
import { Message } from "discord.js";
import { BaseMessageCommand } from "@/structures/base/commands/BaseMessageCommand";
import { chromium } from "playwright-core";

export default class BrowserCommand extends BaseMessageCommand
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            name: "browser",
            description: "Simple puppeteer-core/playwright-core example using BROWSER_WS_ENDPOINT",
            category: CommandCategory.UTILITY,
            cooldown: 10,
            usage: "browser [url]",
            devOnly: true,
        });
    }

    async execute(message: Message, args: string[]): Promise<void>
    {
        const browserWSEndpoint = process.env.BROWSER_WS_ENDPOINT;

        if (!browserWSEndpoint)
        {
            await message.reply("Error: BROWSER_WS_ENDPOINT environment variable is not set.");
            return;
        }

        const url = args[1] || "https://google.com";

        const statusMessage = await message.reply("Starting browser session");

        try
        {
            this.client.logger.info(`[BrowserCommand] Connecting to: ${browserWSEndpoint}`);
            await statusMessage.edit("Connecting to remote browser");

            const browser = await chromium.connectOverCDP(browserWSEndpoint, {
                timeout: 15000,
            });

            this.client.logger.info("[BrowserCommand] Connected successfully. Creating context...");
            await statusMessage.edit("Creating browser");

            const context = await browser.newContext();
            const page = await context.newPage();

            this.client.logger.info(`[BrowserCommand] Navigating to: ${url}`);
            await statusMessage.edit(`Navigating to ${url}`);

            await page.goto(url, {
                waitUntil: "domcontentloaded",
                timeout: 20000,
            });

            this.client.logger.info("[BrowserCommand] Page loaded. Capturing screenshot...");
            await statusMessage.edit("Taking screenshot");

            const title = await page.title();
            const screenshot = await page.screenshot({ type: "png" });

            this.client.logger.info("[BrowserCommand] Screenshot captured. Cleaning up...");
            await statusMessage.edit("Closing session");

            await context.close();
            await browser.close();

            this.client.logger.info("[BrowserCommand] Successfully complete.");

            await message.reply({
                content: `Successfully loaded **${url}**\nPage title: **${title}**`,
                files: [
                    {
                        attachment: screenshot,
                        name: "screenshot.png",
                    },
                ],
            });

            await statusMessage.delete().catch(() =>
            {});
        }
        catch (error)
        {
            this.client.logger.error("Browser command error:", error);
            await statusMessage.edit(`❌ Error`).catch(() =>
            {});
        }
    }
}
