import { Client, Events } from 'discord.js';
import { BaseEvent } from '@/structures/base/events/BaseEvent';
import { ExtendedClient } from '@/structures/Client';

export default class ReadyEvent extends BaseEvent<Events.ClientReady> {
    constructor(client: ExtendedClient) {
        super(client, {
            name: Events.ClientReady,
            once: true
        });
    }

    public async execute(client: Client<true>): Promise<void> {
        this.client.logger.info(`[Event] Ready! Logged in as ${client.user.tag}.`);
    }
} 