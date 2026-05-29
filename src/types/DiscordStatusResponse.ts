export interface DiscordStatusResponse
{
    status: {
        description: string;
        indicator: "none" | "minor" | "major" | "critical";
    };
}
