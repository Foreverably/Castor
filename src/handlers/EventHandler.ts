import { ExtendedClient } from "@/structures/Client";
import { BaseEvent } from "@/structures/base/events/BaseEvent";
import fs from "fs";
import path from "path";

export class EventHandler
{
    private readonly client: ExtendedClient;
    private readonly eventsPath: string;

    constructor(client: ExtendedClient)
    {
        this.client = client;
        this.eventsPath = path.join(__dirname, "..", "events");
    }

    public loadEvents(): void
    {
        const eventEntries = fs.readdirSync(this.eventsPath, { withFileTypes: true });
        const eventFiles = eventEntries
            .filter(
                (dirent) =>
                    dirent.isFile() && (dirent.name.endsWith(".ts") || dirent.name.endsWith(".js")),
            )
            .map((dirent) => dirent.name);

        this.client.logger.debug(`[EventHandler] Found event files: ${eventFiles.join(", ")}.`);

        for (const file of eventFiles)
        {
            const filePath = path.join(this.eventsPath, file);
            try
            {
                const EventClass = require(filePath).default;
                if (!EventClass) continue;

                const event = new EventClass(this.client);

                if (event instanceof BaseEvent)
                {
                    if (event.once)
                    {
                        if (event.enabled)
                        {
                            this.client.once(event.name, (...args) =>
                            {
                                this.client.logger.debug(
                                    `[EventHandler] Event '${event.name}' triggered.`,
                                );
                                event.run(...args);
                            });
                        }
                    }
                    else
                    {
                        if (event.enabled)
                        {
                            this.client.on(event.name, (...args) =>
                            {
                                this.client.logger.debug(
                                    `[EventHandler] Event '${event.name}' triggered.`,
                                );
                                event.run(...args);
                            });
                        }
                    }
                    this.client.logger.info(
                        `[EventHandler] Loaded event: ${event.name} with ${event["modules"]?.length ?? 0} modules.`,
                    );
                }
            }
            catch (error)
            {
                this.client.logger.error(
                    `[EventHandler] Error loading event from file ${file}.`,
                    error,
                );
            }
        }
    }
}
