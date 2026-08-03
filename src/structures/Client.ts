import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import { BaseInteractionListener, BaseSlashCommand } from "@/structures/base";
import { CommandHandler, ErrorHandler, EventHandler, InteractionHandler } from "@/handlers";

import { Logger, MiscUtils } from "@/utils";
import { Settings } from "@/utils/Settings";
import { Status } from "./Status";
import { config } from "@/config";

interface IntentOption
{
    bit: GatewayIntentBits;
    env: string;
    defaultEnabled: boolean;
}

const INTENT_OPTIONS: IntentOption[] = [
    { bit: GatewayIntentBits.Guilds, env: "INTENT_GUILDS", defaultEnabled: true },
    { bit: GatewayIntentBits.GuildMessages, env: "INTENT_GUILD_MESSAGES", defaultEnabled: true },
    // Message Content is a privileged intent; it must be explicitly enabled in the
    // Discord Developer Portal AND via this env flag, otherwise login fails with
    // "Used disallowed intents". It defaults to OFF.
    { bit: GatewayIntentBits.MessageContent, env: "INTENT_MESSAGE_CONTENT", defaultEnabled: false },
    {
        bit: GatewayIntentBits.GuildMessageReactions,
        env: "INTENT_GUILD_MESSAGE_REACTIONS",
        defaultEnabled: true,
    },
];

function isIntentEnabled(option: IntentOption): boolean
{
    const raw = process.env[option.env];
    if (raw === undefined) return option.defaultEnabled;
    return !["0", "false", "off", "no", "disabled"].includes(raw.trim().toLowerCase());
}

function resolveIntents(): GatewayIntentBits[]
{
    return INTENT_OPTIONS.filter(isIntentEnabled).map((option) => option.bit);
}

export class ExtendedClient extends Client
{
    public interactionsListeners: Collection<string, BaseInteractionListener>;
    public interactions: Collection<string, BaseSlashCommand>;

    public readonly logger: Logger;
    public readonly interactionHandler: InteractionHandler;
    public errorHandler: ErrorHandler;
    public globals: typeof config;
    private readonly commandHandler: CommandHandler;
    private readonly eventHandler: EventHandler;
    private readonly statusManager: Status;

    constructor()
    {
        super({
            intents: resolveIntents(),
            partials: [Partials.Message, Partials.Channel, Partials.User, Partials.Reaction],
        });

        this.logger = Logger.getInstance();

        if (!process.env.INTENT_MESSAGE_CONTENT)
        {
            this.logger.warn(
                "[Client] Message Content intent is disabled; prefix commands ('?', '+') will not receive message content.",
            );
        }
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

        this.logger.debug("[Client] Initializing per-guild settings.");
        await Settings.initialize();

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
}
