import {
    BaseSlashCommand,
    Builder,
    Interaction,
} from "@/structures/base/commands/BaseSlashCommand";
import {
    Category,
    VipChannel,
} from "@/structures/base/commands/CommandDecorators";
import { ExtendedClient } from "@/structures/Client";
import { CommandCategory } from "@/types/CommandCategories";
import { ComponentFactory } from "@/utils/ComponentFactory";
import { MessageFlags } from "discord.js";

@Category(CommandCategory.VIP)
@VipChannel()
export default class SlotsCommand extends BaseSlashCommand
{
    constructor(client: ExtendedClient)
    {
        super(client, {
            name: "slots",
            description: "Play a game of slots!",
            cooldown: 5,
            usage: "/slots",
            construct: () =>
                new Builder<"SlashCommandBuilder">()
                    .setName("slots")
                    .setDescription("Play a game of slots!"),
        });
    }

    async execute(interaction: Interaction<"ChatInput">): Promise<void>
    {
        const slotItems = ["🍇", "🍉", "🍊", "🍎", "🍓", "🍒"];

        let win = false;
        let slots: number[][] = [];

        for (let i = 0; i < 3; i++)
        {
            slots[i] = [
                Math.floor(Math.random() * slotItems.length),
                Math.floor(Math.random() * slotItems.length),
                Math.floor(Math.random() * slotItems.length),
            ];
        }

        const number = slots[1];

        if (number[0] === number[1] && number[1] === number[2])
        {
            win = true;
        }
        else if (number[0] === number[1] || number[0] === number[2] || number[1] === number[2])
        {
            win = true;
        }

        const description = slots.map((s) => s.map((i) => slotItems[i]).join(" ")).join("\n");

        const container = ComponentFactory.newContainer()
            .setAccentColor(win ? 0x00ff00 : 0xff0000)
            .addTextDisplayComponents((text) =>
                text.setContent(
                    `## 🎰 Slots\n\n${description}\n\n${win ? "**You won!**" : "**You lost!**"}`,
                ),
            );

        await interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    }
}
