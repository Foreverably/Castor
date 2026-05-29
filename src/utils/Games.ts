export interface RpsGame
{
    uniqueId: string;
    challengerId: string;
    opponentId: string;
    isAgainstBot: boolean;
    challengerChoice?: "rock" | "paper" | "scissors";
    opponentChoice?: "rock" | "paper" | "scissors";
}

export interface TicTacToeGame
{
    uniqueId: string;
    challengerId: string;
    opponentId: string;
    isBot: boolean;
    turn: string;
    board: (string | null)[];
}

export const activeRpsGames = new Map<string, RpsGame>();
export const activeTicTacToeGames = new Map<string, TicTacToeGame>();

export function generateUniqueId(): string
{
    return Math.random().toString(36).substring(2, 9);
}
