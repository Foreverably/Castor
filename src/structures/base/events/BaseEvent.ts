import { ClientEvents } from 'discord.js';
import { ExtendedClient } from '@/structures/Client';
import { BaseSubEvent } from './BaseSubEvent';

/**
 * Defines the options for constructing a BaseEvent.
 */
export interface BaseEventOptions<K extends keyof ClientEvents> {
    name: K;
    once?: boolean;
    modules?: BaseSubEvent<K>[];
    enabled?: boolean;
}

/**
 * Represents a main event that can have its own logic and also dispatch
 * tasks to a series of sub-event modules.
 */
export abstract class BaseEvent<K extends keyof ClientEvents> {
    protected readonly client: ExtendedClient;
    public readonly name: K;
    public readonly once: boolean;
    protected readonly modules: BaseSubEvent<K>[];
    public readonly enabled: boolean;

    constructor(client: ExtendedClient, options: BaseEventOptions<K>) {
        this.client = client;
        this.name = options.name;
        this.once = options.once ?? false;
        this.modules = options.modules ?? [];
        this.enabled = options.enabled ?? true;
    }

    /**
     * The primary execution method called by the EventHandler.
     * It runs the main event logic first, then processes all sub-event modules.
     * This method should not be overridden by child classes.
     */
    public async run(...args: ClientEvents[K]): Promise<void> {
        if (!this.enabled) return;

        try {
            await this.execute(...args);
        } catch (error) {
            this.client.logger.error(`[Event] Error in event '${this.name}'.`, error);
        }

        for (const module of this.modules) {
            if (!module.options.enabled) continue;
            try {
                const handled = await module.execute(...args);
                if (handled) {
                    this.client.logger.debug(`[Event] Module '${module.options.name}' handled event '${this.name}', halting execution chain.`);
                    break;
                }
            } catch (error) {
                this.client.logger.error(`[Event] Error in sub-event module '${module.options.name}' for event '${this.name}'.`, error);
            }
        }
    }

    /**
     * The main logic for the event itself, to be implemented by child classes
     * (e.g., MessageCreateEvent). This logic runs before any sub-modules.
     * If an event only serves to dispatch modules, this method can be empty.
     */
    public abstract execute(...args: ClientEvents[K]): Promise<void>;
}