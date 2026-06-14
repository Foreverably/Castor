import {
    BaseSlashCommand,
    Builder,
    Interaction,
} from "@/structures/base/commands/BaseSlashCommand";
import {
    Category,
    RestrictedFunCommands,
} from "@/structures/base/commands/CommandDecorators";
import { ExtendedClient } from "@/structures/Client";
import { CommandCategory } from "@/types/CommandCategories";
import { actions, objects } from "@/types/Act";
import { MessageFlags, ContainerBuilder } from "discord.js";

@Category(CommandCategory.FUN)
@RestrictedFunCommands()
export default class ActCommand extends BaseSlashCommand
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            name: "act",
            description: "Perform a fun action towards another user!",
            cooldown: 5,
            usage: "/act <user>",
            construct: () =>
                new Builder<"SlashCommandBuilder">()
                    .setName("act")
                    .setDescription("Perform a fun action towards another user!")
                    .addUserOption((option) =>
                        option
                            .setName("user")
                            .setDescription("The user to perform the action on")
                            .setRequired(true),
                    ),
        });
    }

    private doAction(author: string, user: string): string
    {
        const action = actions[Math.floor(Math.random() * actions.length)];
        const object = objects[Math.floor(Math.random() * objects.length)];
        return `<@!${author}> ${action} <@!${user}> with ${object}!`;
    }

    async execute(interaction: Interaction<"ChatInput">): Promise<void>
    {
        const targetUser = interaction.options.getUser("user", true);

        if (targetUser.id === interaction.user.id)
        {
            await interaction.reply({
                content: "You cannot perform this action on yourself!",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const actionMessage = this.doAction(interaction.user.id, targetUser.id);
        const component = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(`${actionMessage}`),
        );

        await interaction.reply({
            allowedMentions: { parse: [] },
            components: [component],
            flags: MessageFlags.IsComponentsV2,
        });
    }
}
