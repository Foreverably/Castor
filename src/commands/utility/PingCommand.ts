import { ExtendedClient } from "@/structures/Client";
import { CommandCategory } from "@/types/CommandCategories";
import { Category, Permissions } from "@/structures/base/commands/CommandDecorators";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    Message,
    MessageFlags,
    SeparatorSpacingSize,
} from "discord.js";
import { BaseMessageCommand } from "@/structures/base/commands/BaseMessageCommand";
import { AnsiBrightFg, AnsiFg, AnsiStyle, Language, Markdown } from "@/utils/discord/Markdown";
import os from "os";
import fetch from "node-fetch";
import { DiscordStatusResponse } from "@/types/DiscordStatusResponse";
import * as mariadb from "mariadb";
import mongoose from "mongoose";
import { chromium } from "playwright-core";

interface ServiceHealth
{
    name: string;
    healthy: boolean;
    latencyMs?: number;
    detail?: string;
}

async function checkBrowserless(): Promise<ServiceHealth>
{
    const endpoint = process.env.BROWSER_WS_ENDPOINT;
    if (!endpoint)
    {
        return { name: "Browserless", healthy: false, detail: "BROWSER_WS_ENDPOINT not set" };
    }

    const start = Date.now();
    try
    {
        const browser = await chromium.connectOverCDP(endpoint, { timeout: 8000 });
        const latencyMs = Date.now() - start;
        await browser.close();
        return { name: "Browserless", healthy: true, latencyMs };
    }
    catch (e: any)
    {
        return {
            name: "Browserless",
            healthy: false,
            latencyMs: Date.now() - start,
            detail: e?.message?.split("\n")[0] ?? "Connection failed",
        };
    }
}

async function checkMariaDB(): Promise<ServiceHealth>
{
    const uri = process.env.MARIADB_URI || process.env.MARIADB_URL;
    if (!uri)
    {
        return { name: "MariaDB", healthy: false, detail: "MARIADB_URI not set" };
    }

    const start = Date.now();
    let conn: mariadb.Connection | null = null;
    try
    {
        conn = await mariadb.createConnection(uri);
        await conn.query("SELECT 1");
        const latencyMs = Date.now() - start;
        return { name: "MariaDB", healthy: true, latencyMs };
    }
    catch (e: any)
    {
        return {
            name: "MariaDB",
            healthy: false,
            latencyMs: Date.now() - start,
            detail: e?.message?.split("\n")[0] ?? "Connection failed",
        };
    }
    finally
    {
        if (conn) await conn.end().catch(() =>
        {});
    }
}

async function checkMongoDB(): Promise<ServiceHealth>
{
    const uri = process.env.MONGODB_URI;
    if (!uri)
    {
        return { name: "MongoDB", healthy: false, detail: "MONGODB_URI not set" };
    }

    const start = Date.now();
    try
    {
        if (mongoose.connection.readyState === 1)
        {
            await mongoose.connection.db?.admin().ping();
            const latencyMs = Date.now() - start;
            return { name: "MongoDB", healthy: true, latencyMs };
        }

        const tempConn = await mongoose.createConnection(uri).asPromise();
        await tempConn.db?.admin().ping();
        const latencyMs = Date.now() - start;
        await tempConn.close();
        return { name: "MongoDB", healthy: true, latencyMs };
    }
    catch (e: any)
    {
        return {
            name: "MongoDB",
            healthy: false,
            latencyMs: Date.now() - start,
            detail: e?.message?.split("\n")[0] ?? "Connection failed",
        };
    }
}

@Category(CommandCategory.DEVELOPER)
@Permissions("Administrator")
export default class PingCommand extends BaseMessageCommand
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            name: "ping",
            description: "Replies with Pong!",
            aliases: ["pong"],
            cooldown: 5,
            usage: "ping [--detailed | -d]",
            devOnly: true,
        });
    }

    async execute(message: Message, args: string[]): Promise<void>
    {
        const clientPing = Date.now() - message.createdTimestamp;
        const isDetailed = args[1] === "--detailed" || args[1] === "-d";

        let systemStatus = "Unknown";
        let statusColor = AnsiFg.White;

        try
        {
            const res = await fetch("https://discordstatus.com/api/v2/status.json");
            const data = (await res.json()) as DiscordStatusResponse;
            systemStatus = data.status.description;

            switch (data.status.indicator)
            {
                case "none":
                    statusColor = AnsiFg.Green;
                    break;
                case "minor":
                    statusColor = AnsiFg.Yellow;
                    break;
                case "major":
                case "critical":
                    statusColor = AnsiFg.Red;
                    break;
                default:
                    statusColor = AnsiFg.White;
            }
        }
        catch (e)
        {
            systemStatus = "Failed to fetch status";
            statusColor = AnsiFg.Red;
            this.client.logger.error("Failed to fetch Discord status:", e);
        }

        const [browserless, mariadb, mongodb] = await Promise.all([
            checkBrowserless(),
            checkMariaDB(),
            checkMongoDB(),
        ]);

        const services: ServiceHealth[] = [browserless, mariadb, mongodb];
        const healthyCount = services.filter((s) => s.healthy).length;
        const allHealthy = healthyCount === services.length;
        const noneHealthy = healthyCount === 0;

        const servicesColor = allHealthy
            ? AnsiBrightFg.Green
            : noneHealthy
              ? AnsiFg.Red
              : AnsiFg.Yellow;

        const servicesLabel = allHealthy ? "Healthy" : noneHealthy ? "Unhealthy" : "Degraded";

        const headerText = `# Pong!\n-# System Status & Detailed Information`;

        const linkButton = new ButtonBuilder()
            .setLabel("Discord Status")
            .setStyle(ButtonStyle.Link)
            .setURL("https://discordstatus.com");

        if (!isDetailed)
        {
            const component = new ContainerBuilder()
                .setAccentColor(0xaf4a51)
                .addTextDisplayComponents((t) => t.setContent(headerText))
                .addSeparatorComponents((s) => s.setDivider(true))
                .addTextDisplayComponents((t) =>
                    t.setContent(
                        Markdown.codeBlock(
                            `${Markdown.ansi(`[ Discord ]`, AnsiFg.Blue, AnsiStyle.Bold)} ${Markdown.ansi(systemStatus, statusColor, AnsiStyle.Bold)}\n` +
                                `${Markdown.ansi("[ WebSocket ]", AnsiFg.Yellow, AnsiStyle.Bold)} ${Markdown.formatPing(this.client.ws.ping, true)}\n` +
                                `${Markdown.ansi("[ Client ]", AnsiFg.Blue, AnsiStyle.Bold)} ${Markdown.formatPing(clientPing, true)}\n` +
                                `${Markdown.ansi("[ Services ]", servicesColor, AnsiStyle.Bold)} ${Markdown.ansi(`${servicesLabel} (${healthyCount}/${services.length})`, servicesColor, AnsiStyle.Bold)}\n`,
                            Language.ANSI,
                        ),
                    ),
                )
                .addSeparatorComponents((s) => s.setDivider(true))
                .addTextDisplayComponents((t) =>
                    t.setContent(
                        `-# Do not rely on this for information: ${Markdown.maskedLink("**Discord Status Page**", "https://discordstatus.com")}`,
                    ),
                )
                .addActionRowComponents(
                    new ActionRowBuilder<ButtonBuilder>().addComponents(linkButton),
                );

            await message.reply({
                components: [component],
                flags: MessageFlags.IsComponentsV2,
            });
        }
        else
        {
            const cpus = os.cpus();
            const cpuModel = cpus && cpus.length > 0 ? cpus[0].model : "Unknown";
            const cpuCores = cpus ? cpus.length : "Unknown";

            const uptimeSeconds = process.uptime();
            const formatUptime = (secs: number) =>
            {
                const d = Math.floor(secs / 86400);
                const h = Math.floor((secs % 86400) / 3600);
                const m = Math.floor((secs % 3600) / 60);
                const s = Math.floor(secs % 60);
                return `${d}d ${h}h ${m}m ${s}s`;
            };

            const formatService = (svc: ServiceHealth): string =>
            {
                const indicator = svc.healthy
                    ? Markdown.ansi("-", AnsiBrightFg.Green, AnsiStyle.Bold)
                    : Markdown.ansi("-", AnsiFg.Red, AnsiStyle.Bold);

                const nameColor = svc.healthy ? AnsiBrightFg.Green : AnsiFg.Red;
                const name = Markdown.ansi(`[ ${svc.name} ]`, nameColor, AnsiStyle.Bold);

                const latency =
                    svc.latencyMs !== undefined
                        ? Markdown.formatPing(svc.latencyMs, true)
                        : Markdown.ansi("N/A", AnsiFg.White, AnsiStyle.Dim);

                const status = svc.healthy
                    ? `${latency}`
                    : `${latency}  ${Markdown.ansi(svc.detail ?? "Unreachable", AnsiFg.Red, AnsiStyle.Dim)}`;

                return `${indicator} ${name} ${status}`;
            };

            const component = new ContainerBuilder()
                .setAccentColor(0x610f10)
                .addTextDisplayComponents((t) => t.setContent(headerText))
                .addSeparatorComponents((s) => s.setDivider(true))
                .addTextDisplayComponents((t) =>
                    t.setContent(
                        Markdown.codeBlock(
                            `${Markdown.ansi(`[ Discord ]`, AnsiFg.Blue, AnsiStyle.Bold)} ${Markdown.ansi(systemStatus, statusColor, AnsiStyle.Bold)}\n` +
                                `${Markdown.ansi("[ WebSocket ]", AnsiFg.Yellow, AnsiStyle.Bold)} ${Markdown.formatPing(this.client.ws.ping, true)}\n` +
                                `${Markdown.ansi("[ Client ]", AnsiFg.Blue, AnsiStyle.Bold)} ${Markdown.formatPing(clientPing, true)}\n` +
                                `${Markdown.ansi(`[ Services ] ${servicesLabel} (${healthyCount}/${services.length})`, servicesColor, AnsiStyle.Bold)}\n` +
                                `${services.map(formatService).join("\n")}\n` +
                                `${Markdown.ansi(`[ CPU ] ${cpuModel} (${cpuCores} cores)`, AnsiFg.White, AnsiStyle.Dim)}\n` +
                                `${Markdown.ansi(`[ Uptime ] ${formatUptime(uptimeSeconds)}`, AnsiFg.White, AnsiStyle.Dim)}\n`,
                            Language.ANSI,
                        ),
                    ),
                )
                .addSeparatorComponents((s) => s.setDivider(true))
                .addTextDisplayComponents((t) =>
                    t.setContent(
                        `-# Do not rely on this for information. Instead check: ${Markdown.maskedLink("**Discord Status Page**", "https://discordstatus.com")}`,
                    ),
                )
                .addActionRowComponents(
                    new ActionRowBuilder<ButtonBuilder>().addComponents(linkButton),
                );

            await message.reply({
                components: [component],
                flags: MessageFlags.IsComponentsV2,
            });
        }
    }
}
