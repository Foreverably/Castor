import {
    BaseSlashCommand,
    Builder,
    Interaction,
} from "@/structures/base/commands/BaseSlashCommand";
import { ExtendedClient } from "@/structures/Client";
import { CommandCategory } from "@/types/CommandCategories";
import { Category } from "@/structures/base/commands/CommandDecorators";
import { chromium } from "playwright-core";

@Category(CommandCategory.UTILITY)
export default class BrowserCommand extends BaseSlashCommand
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            name: "browser",
            description:
                "Simple puppeteer-core/playwright-core example using BROWSER_WS_ENDPOINT",
            cooldown: 10,
            usage: "/browser [url]",
            devOnly: true,
            construct: () =>
                new Builder<"SlashCommandBuilder">()
                    .setName("browser")
                    .setDescription(
                        "Open a URL in the remote browser and screenshot it",
                    )
                    .addStringOption((option) =>
                        option
                            .setName("url")
                            .setDescription("The URL to visit (defaults to Google)."),
                    ),
        });
    }

    async execute(interaction: Interaction<"ChatInput">): Promise<void>
    {
        const browserWSEndpoint = process.env.BROWSER_WS_ENDPOINT;

        if (!browserWSEndpoint)
        {
            await interaction.reply(
                "Error: BROWSER_WS_ENDPOINT environment variable is not set.",
            );
            return;
        }

        const url = interaction.options.getString("url") || "https://google.com";

        await interaction.deferReply();

        try
        {
            this.client.logger.info(`[BrowserCommand] Connecting to: ${browserWSEndpoint}`);
            await interaction.editReply("Connecting to remote browser");

            const browser = await chromium.connectOverCDP(browserWSEndpoint, {
                timeout: 15000,
            });

            this.client.logger.info("[BrowserCommand] Connected successfully. Creating context...");
            await interaction.editReply("Creating browser");

            const context = await browser.newContext();
            const page = await context.newPage();

            this.client.logger.info(`[BrowserCommand] Navigating to: ${url}`);
            await interaction.editReply(`Navigating to ${url}`);

            await page.goto(url, {
                waitUntil: "domcontentloaded",
                timeout: 20000,
            });

            this.client.logger.info("[BrowserCommand] Page loaded. Capturing screenshot...");
            await interaction.editReply("Taking screenshot");

            const title = await page.title();
            const screenshot = await page.screenshot({ type: "png" });

            this.client.logger.info("[BrowserCommand] Screenshot captured. Cleaning up...");
            await interaction.editReply("Closing session");

            await context.close();
            await browser.close();

            this.client.logger.info("[BrowserCommand] Successfully complete.");

            await interaction.editReply({
                content: `Successfully loaded **${url}**\nPage title: **${title}**`,
                files: [
                    {
                        attachment: screenshot,
                        name: "screenshot.png",
                    },
                ],
            });
        }
        catch (error)
        {
            this.client.logger.error("Browser command error:", error);
            await interaction.editReply(`❌ Error`).catch(() =>
            {});
        }
    }
}
