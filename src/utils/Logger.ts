interface LogColors
{
    reset: string;
    debug: string;
    info: string;
    warn: string;
    error: string;
    time: string;
}

export class Logger
{
    private static instance: Logger;
    private readonly colors: LogColors;
    private readonly debugMode: boolean;

    private constructor()
    {
        this.debugMode = process.env.DEBUG === "true";
        this.colors = {
            reset: "\x1b[0m",
            debug: "\x1b[36m", // Cyan
            info: "\x1b[32m", // Green
            warn: "\x1b[33m", // Yellow
            error: "\x1b[31m", // Red
            time: "\x1b[90m", // Gray
        };
    }

    public static getInstance(): Logger
    {
        if (!Logger.instance)
        {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private getTimestamp(): string
    {
        const now = new Date();
        return `${this.colors.time}[${now.toISOString()}]${this.colors.reset}`;
    }

    private formatMessage(level: string, color: string, message: string, ...args: any[]): string
    {
        const formattedArgs = args.map((arg) =>
        {
            if (arg instanceof Error)
            {
                return arg.stack || arg.message;
            }
            if (typeof arg === "object")
            {
                try
                {
                    return JSON.stringify(arg, null, 2);
                }
                catch
                {
                    return String(arg);
                }
            }
            return String(arg);
        });

        return `${this.getTimestamp()} ${color}[${level}]${this.colors.reset} ${message} ${formattedArgs.join(" ")}`;
    }

    public debug(message: string, ...args: any[]): void
    {
        if (!this.debugMode) return;
        console.log(this.formatMessage("DEBUG", this.colors.debug, message, ...args));
    }

    public info(message: string, ...args: any[]): void
    {
        console.log(this.formatMessage("INFO", this.colors.info, message, ...args));
    }

    public warn(message: string, ...args: any[]): void
    {
        console.warn(this.formatMessage("WARN", this.colors.warn, message, ...args));
    }

    public error(message: string | Error, ...args: any[]): void
    {
        let errorMessage: string;
        let errorArgs: any[] = args;

        if (message instanceof Error)
        {
            errorMessage = message.stack || message.message;
            errorArgs = [message, ...args];
        }
        else
        {
            errorMessage = message;
        }

        console.error(this.formatMessage("ERROR", this.colors.error, errorMessage, ...errorArgs));
    }

    public hr(char: string = "-"): void
    {
        console.log(char.repeat(80));
    }
}
