import { SeparatorBuilder, SeparatorSpacingSize, TextDisplayBuilder } from "discord.js";

export function pingComponent(interaction)
{
	if (Math.round(interaction.client.ws.ping) == -1)
	{
		const pingFailedPreConComponent = [
			new TextDisplayBuilder().setContent("## Ping"),
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
			new TextDisplayBuilder().setContent(`\`\`\`\n[ WebSocket Latency ]   Unable to Determine\n\`\`\`\n-# *Ping could not be determined, this may be due to the command being ran too early.*`)
		];
		return pingFailedPreConComponent;
	}

	else
	{
		const pingComponent = [
			new TextDisplayBuilder().setContent("## Ping"),
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
			new TextDisplayBuilder().setContent(`\`\`\`\n[ WebSocket Latency ]   ${Math.round(interaction.client.ws.ping)}\n\`\`\``)
		];
		return pingComponent;
	}
}