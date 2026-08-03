import { ActivityType, ClientPresenceStatus } from "discord.js";
import { ExtendedClient } from "./Client";

export interface StatusConfig
{
    name: string;
    type: ActivityType;
    status: ClientPresenceStatus;
}

export class Status
{
    private readonly client: ExtendedClient;
    private currentIndex: number = 0;
    private intervalTime: number = 60000;
    public readonly statuses: StatusConfig[];

    constructor(client: ExtendedClient)
    {
        this.client = client;
        this.statuses = [
            {
                name: "poker with Espie and Wobin",
                type: ActivityType.Competing,
                status: "online",
            },
            {
                name: `to commands`,
                type: ActivityType.Listening,
                status: "online",
            },
        ];
    }

    private setStatus(status: StatusConfig): void
    {
        this.client.user?.setPresence({
            activities: [
                {
                    name: status.name,
                    type: status.type,
                },
            ],
            status: status.status,
        });

        this.client.logger.debug(`[Status] Status updated: ${status.name}.`);
    }

    public updateCounts(): void
    {
        this.client.logger.debug("[Status] Status counts updated.");
    }

    public start(): void
    {
        this.setStatus(this.statuses[0]);

        setInterval(() =>
        {
            this.updateCounts();
            this.currentIndex = (this.currentIndex + 1) % this.statuses.length;
            this.setStatus(this.statuses[this.currentIndex]);
        }, this.intervalTime);
    }

    public addStatus(status: StatusConfig): void
    {
        this.statuses.push(status);
        this.client.logger.debug(`[Status] New status added: ${status.name}.`);
    }

    public removeStatus(index: number): boolean
    {
        if (index >= 0 && index < this.statuses.length)
        {
            this.statuses.splice(index, 1);
            this.client.logger.debug(`[Status] Status removed at index ${index}.`);
            return true;
        }
        return false;
    }

    public getStatuses(): StatusConfig[]
    {
        return [...this.statuses];
    }

    public get interval(): number
    {
        return this.intervalTime;
    }

    public setInterval(ms: number): void
    {
        if (ms >= 5000)
        {
            this.intervalTime = ms;
            this.client.logger.debug(`[Status] Status interval updated: ${ms}ms.`);
        }
    }

    public getCurrentStatus(): StatusConfig
    {
        return this.statuses[this.currentIndex];
    }
}
