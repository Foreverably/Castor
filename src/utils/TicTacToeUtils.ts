import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export function getTicTacToeButtons(
    board: (string | null)[],
    uniqueId: string,
    disableAll: boolean = false,
): ActionRowBuilder<ButtonBuilder>[]
{
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    for (let i = 0; i < 3; i++)
    {
        const row = new ActionRowBuilder<ButtonBuilder>();
        for (let j = 0; j < 3; j++)
        {
            const index = i * 3 + j;
            const val = board[index];
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`ttt_${index}_${uniqueId}`)
                    .setLabel(val === "X" ? "X" : val === "O" ? "O" : "\u200b")
                    .setStyle(
                        val === "X"
                            ? ButtonStyle.Primary
                            : val === "O"
                              ? ButtonStyle.Danger
                              : ButtonStyle.Secondary,
                    )
                    .setDisabled(disableAll || val !== null),
            );
        }
        rows.push(row);
    }
    return rows;
}

export function checkWin(board: (string | null)[]): string | null
{
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++)
    {
        const [a, b, c] = lines[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c])
        {
            return board[a];
        }
    }
    return null;
}

export function checkDraw(board: (string | null)[]): boolean
{
    return board.every((cell) => cell !== null);
}

export function getBotMove(board: (string | null)[]): number
{
    const emptyIndices = board
        .map((val, index) => (val === null ? index : null))
        .filter((val) => val !== null) as number[];
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
}
