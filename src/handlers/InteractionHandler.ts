import { ExtendedClient } from "@/structures/Client";
import { BaseInteractionListener, InteractionContext } from "@/structures/base";
import { ComponentType, Interaction, MessageFlags } from "discord.js";
import fs from "fs";
import path from "path";

export class InteractionHandler
{
    private readonly client: ExtendedClient;
    private readonly listenersPath: string;

    constructor(client: ExtendedClient)
    {
        this.client = client;
        this.listenersPath = path.join(__dirname, "..", "interactions");
    }

    public async loadListeners(): Promise<void>
    {
        if (!fs.existsSync(this.listenersPath))
        {
            this.client.logger.debug(
                "[InteractionHandler] Interactions directory not found, skipping interactions loading.",
            );
            return;
        }

        const categoryDirs = fs
            .readdirSync(this.listenersPath, { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => dirent.name);

        this.client.logger.debug(
            `[InteractionHandler] Found interactions category directories: ${categoryDirs.join(", ")}.`,
        );

        if (categoryDirs.length === 0)
        {
            await this.loadListenersFromDirectory(this.listenersPath);
            return;
        }

        for (const category of categoryDirs)
        {
            const categoryPath = path.join(this.listenersPath, category);
            await this.loadListenersFromDirectory(categoryPath, category);
        }
    }

    private async loadListenersFromDirectory(
        directoryPath: string,
        category?: string,
    ): Promise<void>
    {
        const listenerFiles = fs
            .readdirSync(directoryPath)
            .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

        this.client.logger.debug(
            `[InteractionHandler] Loading listeners from ${category || "root"}: ${listenerFiles.join(", ")}.`,
        );

        for (const file of listenerFiles)
        {
            const filePath = path.join(directoryPath, file);

            try
            {
                const ListenerClass = require(filePath).default;

                if (ListenerClass && ListenerClass.prototype instanceof BaseInteractionListener)
                {
                    const listener: BaseInteractionListener = new ListenerClass(this.client);

                    const listenerKey = this.getListenerKey(listener, file);

                    this.client.interactionsListeners.set(listenerKey, listener);

                    const listenerInfo = this.getListenerInfo(listener);
                    this.client.logger.debug(
                        `[InteractionHandler] Loaded listener: ${listenerInfo} (${category || "uncategorized"}).`,
                    );
                }
                else
                {
                    this.client.logger.warn(
                        `[InteractionHandler] Invalid listener file: ${file} - Must extend BaseInteractionListener.`,
                    );
                }
            }
            catch (error)
            {
                this.client.logger.error(
                    `[InteractionHandler] Error loading listener from file ${file}.`,
                    error,
                );
            }
        }
    }

    private getListenerKey(listener: BaseInteractionListener, fileName?: string): string
    {
        if (listener.customId)
        {
            return listener.customId;
        }
        if (listener.name)
        {
            return `interaction:${listener.name}`;
        }

        if (fileName)
        {
            return `file:${path.basename(fileName, path.extname(fileName))}`;
        }
        return `interaction:${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    /**
     * Register a single interaction manually
     */
    public registerListener(listener: BaseInteractionListener): void
    {
        if (!(listener instanceof BaseInteractionListener))
        {
            throw new Error("Listener must extend BaseInteractionListener");
        }

        const listenerKey = this.getListenerKey(listener);
        this.client.interactionsListeners.set(listenerKey, listener);

        const listenerInfo = this.getListenerInfo(listener);
        this.client.logger.debug(`[InteractionHandler] Registered listener: ${listenerInfo}.`);
    }

    /**
     * Handle an incoming interaction
     */
    public async handleInteraction(interaction: Interaction): Promise<boolean>
    {
        for (const [id, listener] of this.client.interactionsListeners)
        {
            try
            {
                const handled = await listener.handle(
                    interaction as InteractionContext<"ContextMenu" | "Autocomplete" | "Component">,
                );

                if (handled)
                {
                    this.client.logger.debug(
                        `[InteractionHandler] Interaction ${interaction.id} handled by listener: ${id}.`,
                    );
                    return true;
                }
            }
            catch (error)
            {
                this.client.logger.error(`[InteractionHandler] Error in listener ${id}.`, error);

                if (interaction.isRepliable() && !interaction.replied && !interaction.deferred)
                {
                    await interaction
                        .reply({
                            content: "An error occurred while processing this interaction.",
                            flags: MessageFlags.Ephemeral,
                        })
                        .catch(() =>
                        {});
                }
            }
        }

        this.client.logger.debug(
            `[InteractionHandler] No listener handled interaction: ${interaction.id}.`,
        );
        return false;
    }

    private getListenerInfo(listener: BaseInteractionListener): string
    {
        if (listener.customId)
        {
            return `${listener.customId}${listener.componentType ? ` (${ComponentType[listener.componentType]})` : ""}`;
        }

        if (listener.name)
        {
            return listener.name;
        }

        return `Unknown ${listener.customId || "unknown"}`;
    }

    public findListenerByCustomId(customId: string): BaseInteractionListener | undefined
    {
        for (const listener of this.client.interactionsListeners.values())
        {
            if (listener.customId === customId)
            {
                return listener;
            }
        }
        return undefined;
    }

    public findListenerByCommandName(name: string): BaseInteractionListener | undefined
    {
        for (const listener of this.client.interactionsListeners.values())
        {
            if (listener.name === name)
            {
                return listener;
            }
        }
        return undefined;
    }

    public getListenersByComponentType(componentType: ComponentType): BaseInteractionListener[]
    {
        return Array.from(this.client.interactionsListeners.values()).filter(
            (listener) => listener.componentType === componentType,
        );
    }

    public removeListener(listenerId: string): boolean
    {
        const removed = this.client.interactionsListeners.delete(listenerId);
        if (removed)
        {
            this.client.logger.debug(`[InteractionHandler] Removed listener: ${listenerId}.`);
        }
        return removed;
    }

    public removeListenerByCustomId(customId: string): boolean
    {
        const listener = this.findListenerByCustomId(customId);
        if (listener)
        {
            return this.removeListener(this.getListenerKey(listener));
        }
        return false;
    }

    public clearListeners(): void
    {
        this.client.interactionsListeners.clear();
        this.client.logger.debug("[InteractionHandler] Cleared all listeners.");
    }

    public getListenerCount(): number
    {
        return this.client.interactionsListeners.size;
    }

    public getAllListeners(): Map<string, BaseInteractionListener>
    {
        return new Map(this.client.interactionsListeners);
    }
}
