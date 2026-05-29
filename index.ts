import dotenv from "dotenv";
// DO NOT MOVE THIS LINE UNLESS YOU WANT THE SPAWN OF SATAN TO CONSUME YOUR SOUL
dotenv.config(); // Please dont touch this line

import { ExtendedClient } from "./src/structures/Client";
import { CommandDeployer } from "./src/utils/CommandDeployer";

class BotManager
{
    private readonly client: ExtendedClient;
    private readonly deployer: CommandDeployer;

    constructor()
    {
        this.client = new ExtendedClient();
        this.deployer = new CommandDeployer(this.client);
        this.setupErrorHandlers();
        this.client.logger.debug("[Client] BotManager initialized.");
    }

    public async start(deploy: boolean = false): Promise<void>
    {
        try
        {
            if (deploy)
            {
                this.client.logger.info("[Client] Deploying commands.");
                await this.deployer.deploy();
                this.client.logger.info("[Client] Commands deployed successfully.");
            }

            await this.client.init();
            this.client.logger.info("[Client] Bot started successfully.");
        }
        catch (error: any)
        {
            await this.client.errorHandler.handleError(error, {
                command: "Bot Startup",
            });
            this.client.logger.error("[Client] Error starting bot.", error);
            process.exit(1);
        }
    }

    private setupErrorHandlers(): void
    {
        process.on("unhandledRejection", (error: Error) =>
        {
            this.client.errorHandler.handleError(error, {
                command: "Process: Unhandled Rejection",
            });
        });

        process.on("uncaughtException", (error: Error) =>
        {
            this.client.errorHandler.handleError(error, {
                command: "Process: Uncaught Exception",
            });
        });
    }
}

new BotManager().start(process.argv.includes("--deploy"));
