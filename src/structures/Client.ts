import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import { BaseInteractionListener, BaseMessageCommand, BaseSlashCommand } from "@/structures/base";
import { CommandHandler, ErrorHandler, EventHandler, InteractionHandler } from "@/handlers";

import { Logger, MiscUtils } from "@/utils";
import { Status } from "./Status";
import { config } from "@/config";
import * as mongoose from "mongoose";

export class ExtendedClient extends Client
{
    public commands: Collection<string, BaseMessageCommand>;
    public interactionsListeners: Collection<string, BaseInteractionListener>;
    public interactions: Collection<string, BaseSlashCommand>;

    public readonly logger: Logger;
    public readonly interactionHandler: InteractionHandler;
    public errorHandler: ErrorHandler;
    public globals: typeof config;
    private readonly commandHandler: CommandHandler;
    private readonly eventHandler: EventHandler;
    private readonly statusManager: Status;
    private databaseConnected: boolean = false;

    constructor()
    {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildModeration,
                GatewayIntentBits.GuildMessageReactions,
            ],
            partials: [Partials.Message, Partials.Channel, Partials.User, Partials.Reaction],
        });

        this.logger = Logger.getInstance();
        this.commands = new Collection();
        this.interactionsListeners = new Collection();
        this.interactions = new Collection();
        this.interactionHandler = new InteractionHandler(this);
        this.commandHandler = new CommandHandler(this);
        this.eventHandler = new EventHandler(this);
        this.statusManager = new Status(this);
        this.errorHandler = new ErrorHandler(this);
        this.globals = config;
    }

    public async init(): Promise<void>
    {
        this.logger.debug("[Client] Initializing client.");

        this.logger.debug("[Client] Connecting to MongoDB.");
        await this.connectToDatabase();

        this.logger.debug("[Client] Loading commands.");
        await this.commandHandler.loadCommands();

        this.logger.debug("[Client] Loading events.");
        this.eventHandler.loadEvents();

        this.logger.debug("[Client] Loading interactions.");
        await this.interactionHandler.loadListeners();

        this.logger.debug("[Client] Logging in.");
        await this.login(process.env.DISCORD_TOKEN);

        this.logger.debug("[Client] Starting status rotation.");
        this.statusManager.start();
    }

    public getStatusManager(): Status
    {
        return this.statusManager;
    }

    public getDatabaseHealthCheck(): boolean
    {
        return this.databaseConnected;
    }

    private async connectToDatabase(retries: number = 3): Promise<void>
    {
        for (let attempt = 1; attempt <= retries; attempt++)
        {
            try
            {
                const mongoUri = process.env.MONGODB_URI;
                if (!mongoUri)
                {
                    throw new Error("MONGODB_URI is not defined in environment variables");
                }

                const startedAt = Date.now();

                const connection = await mongoose.connect(mongoUri);

                await connection.connection.db?.admin().ping();

                const duration = Date.now() - startedAt;
                this.logger.info(`[Client] Connected to MongoDB in ${duration}ms.`);
                this.databaseConnected = true;
                return;
            }
            catch (error: any)
            {
                this.logger.error(
                    `[Client] Failed to connect to MongoDB: ${error.message || error}.`,
                );

                if (attempt === retries)
                {
                    this.logger.error("[Client] Failed to connect to MongoDB after all retries.");
                    this.databaseConnected = false;
                    throw error;
                }

                this.logger.warn(`[Client] Retrying connection (${attempt}/${retries}).`);

                await MiscUtils.delay(1000 * attempt);
            }
        }
    }
}
