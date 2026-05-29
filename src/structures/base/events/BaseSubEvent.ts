import { ClientEvents } from 'discord.js';
import { ExtendedClient } from '../../Client';

/**
 * Defines the options for a BaseSubEvent.
 */
export interface BaseSubEventOptions {
    name: string;
    description?: string;
    enabled?: boolean;
}

/**
 * Represents a single, modular piece of logic that can be attached to a main event.
 */
export abstract class BaseSubEvent<K extends keyof ClientEvents> {
    protected readonly client: ExtendedClient;
    public readonly options: BaseSubEventOptions;
    protected readonly enabled: boolean;
    constructor(client: ExtendedClient, options: BaseSubEventOptions) {
        this.client = client;
        this.options = options;
        this.enabled = options.enabled ?? true;
    }

    /**
     * Executes the sub-event's logic.
     * @param args The arguments for the event.
     * @returns A Promise that resolves to `true` if the event was handled and 
     * subsequent sub-events should not be run, otherwise `false`.
     */
    public abstract execute(...args: ClientEvents[K]): Promise<boolean>;
}

/**
 * Base class for raw event sub-modules.
 */
export abstract class BaseRawSubEvent {
    protected readonly client: ExtendedClient;
    public readonly options: { name: string };

    constructor(client: ExtendedClient, options: { name: string }) {
        this.client = client;
        this.options = options;
    }

    /**
     * Execute the sub-event module logic.
     * @param packet The raw gateway packet
     * @param shardId The shard ID
     * @returns Whether the event was handled (true to halt execution chain)
     */
    public abstract execute(packet: any, shardId: number): Promise<boolean>;
}