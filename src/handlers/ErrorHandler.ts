import {
    AutocompleteInteraction,
    CacheType,
    ChatInputCommandInteraction,
    Colors,
    EmbedBuilder,
    Guild,
    TextChannel,
    User,
} from "discord.js";
import { ExtendedClient } from "../structures/Client";
import { config } from "../config";

interface ErrorContext
{
    user?: User;
    guild?: Guild;
    command?: string;
    interaction?: ChatInputCommandInteraction;
    autocomplete?: AutocompleteInteraction<CacheType>;
}

export class ErrorHandler
{
    private readonly client: ExtendedClient;

    constructor(client: ExtendedClient)
    {
        this.client = client;
    }

    public async handleError(error: Error | any, context?: ErrorContext): Promise<void>
    {
        try
        {
            const { logChannel } = await this.getChannels();
            const errorEmbed = this.createErrorEmbed(error, context);

            if (logChannel)
            {
                try
                {
                    await logChannel.send({ embeds: [errorEmbed] });
                }
                catch (channelError)
                {
                    this.client.logger.warn(
                        "[ErrorHandler] Failed to send error to log channel.",
                        channelError,
                    );
                }
            }

            this.client.logger.error("[ErrorHandler] Error occurred.", {
                error: error instanceof Error ? error.stack || error.message : error,
                context: {
                    user: context?.user?.tag,
                    guild: context?.guild?.name,
                    command: context?.command,
                },
            });
        }
        catch (loggingError)
        {
            this.client.logger.error("[ErrorHandler] Failed to log error.", loggingError);
            this.client.logger.error("[ErrorHandler] Original error.", error.stack);
        }
    }

    private async getChannels(): Promise<{ logChannel?: TextChannel }>
    {
        const channels: { logChannel?: TextChannel } = {};

        if (config.channels.internalLog && config.channels.internalLog.trim() !== "")
        {
            try
            {
                channels.logChannel = (await this.client.channels.fetch(
                    config.channels.internalLog,
                )) as TextChannel;
            }
            catch (error)
            {
                this.client.logger.warn(
                    "[ErrorHandler] Failed to fetch internal log channel.",
                    error,
                );
            }
        }

        return channels;
    }

    private formatError(error: Error | any): string
    {
        const maxLength = 1000;
        let errorText: string;

        if (error instanceof Error)
        {
            errorText = error.stack || error.message;
        }
        else
        {
            try
            {
                errorText = JSON.stringify(error, null, 2);
            }
            catch
            {
                errorText = String(error);
            }
        }

        if (errorText.length > maxLength)
        {
            errorText = errorText.substring(0, maxLength - 3) + "...";
        }

        return `\`\`\`\n${errorText}\n\`\`\``;
    }

    private createErrorEmbed(error: Error | any, context?: ErrorContext): EmbedBuilder
    {
        const embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle("Error Occurred")
            .setTimestamp();

        embed.addFields({
            name: "Error Type",
            value: error instanceof Error ? error.name : "Unknown Error",
            inline: true,
        });

        if (context?.command)
        {
            embed.addFields({
                name: "Command",
                value: context.command,
                inline: true,
            });
        }

        if (context?.user)
        {
            embed.addFields({
                name: "User",
                value: `${context.user.tag} (${context.user.id})`,
                inline: true,
            });
        }

        if (context?.guild)
        {
            embed.addFields({
                name: "Guild",
                value: `${context.guild.name} (${context.guild.id})`,
                inline: true,
            });
        }

        embed.addFields({
            name: "Error Details",
            value: this.formatError(error),
        });

        return embed;
    }
}
