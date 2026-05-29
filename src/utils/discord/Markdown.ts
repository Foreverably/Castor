/**
 * Common languages supported by Discord (via highlight.js)
 *
 * If these do not support your desired language please add them here, you could instead pass in a string instead of this enum.
 */
export enum Language
{
	TypeScript = "ts",
	JavaScript = "js",
	Python = "py",
	CPlusPlus = "cpp",
	CSharp = "cs",
	Java = "java",
	Markdown = "md",
	JSON = "json",
	ANSI = "ansi",
	HTML = "html",
	CSS = "css",
	SQL = "sql",
	YAML = "yaml",
	Rust = "rust",
	Go = "go"
}

export enum TimestampStyle
{
	ShortTime = "t",
	LongTime = "T",
	ShortDate = "d",
	LongDate = "D",
	ShortDateTime = "f",
	LongDateTime = "F",
	Relative = "R",
}

/**
 * ANSI escape code prefix
 */
const ESC = "\u001b";

/**
 * Reset; must be used after almost every colored/styled segment
 */
export const RESET = `${ESC}[0m`;

/**
 * Basic text styles (Select Graphic Rendition - SGR)
 */
export enum AnsiStyle
{
	Reset = "0",
	Bold = "1",
	Dim = "2",
	Italic = "3",
	Underline = "4",
	Blink = "5",
	Reverse = "7",
	Hidden = "8",
	Strikethrough = "9",
}

/**
 * Standard foreground colors (30-37)
 */
export enum AnsiFg
{
	Black = "30",
	Red = "31",
	Green = "32",
	Yellow = "33",
	Blue = "34",
	Magenta = "35",
	Cyan = "36",
	White = "37",
}

/**
 * Bright / high-intensity foreground colors (90-97)
 */
export enum AnsiBrightFg
{
	Black = "90",
	Red = "91",
	Green = "92",
	Yellow = "93",
	Blue = "94",
	Magenta = "95",
	Cyan = "96",
	White = "97",
}

/**
 * Standard background colors (40-47)
 */
export enum AnsiBg
{
	Black = "40",
	Red = "41",
	Green = "42",
	Yellow = "43",
	Blue = "44",
	Magenta = "45",
	Cyan = "46",
	White = "47",
}

/**
 * Bright background colors (100-107)
 */
export enum AnsiBrightBg
{
	Black = "100",
	Red = "101",
	Green = "102",
	Yellow = "103",
	Blue = "104",
	Magenta = "105",
	Cyan = "106",
	White = "107",
}

/**
 * Helper to combine multiple ANSI codes into one escape sequence
 * Example: combine(AnsiStyle.Bold, AnsiFg.Red) → \u001b[1;31m
 */
function combine(...codes: (string | AnsiStyle | AnsiFg | AnsiBrightFg | AnsiBg | AnsiBrightBg)[]): string
{
	if (codes.length === 0) return "";
	return `${ESC}[${codes.join(";")}m`;
}

export class Markdown
{

	/**
	 * Applies one or more ANSI styles/colors to text and resets afterward
	 *
	 * @example
	 * ```ts
	 * Markdown.ansi('Error!', AnsiFg.Red, AnsiStyle.Bold)
	 * // -> \u001b[31;1mError!\u001b[0m
	 * ```
	 */
	static ansi(
		text: string,
		...codes: (AnsiStyle | AnsiFg | AnsiBrightFg | AnsiBg | AnsiBrightBg)[]): string
	{
		if (codes.length === 0) return text;
		const open = combine(...codes);
		return `${open}${text}${RESET}`;
	}

	/**
	 * Convenience for foreground color only
	 */
	static color(text: string, color: AnsiFg | AnsiBrightFg): string
	{
		return this.ansi(text, color);
	}

	/**
	 * Convenience for background color only
	 */
	static bg(text: string, bg: AnsiBg | AnsiBrightBg): string
	{
		return this.ansi(text, bg);
	}

	/**
	 * Formats a ping value with color coding based on latency thresholds.
	 */
	static formatPing(ping: number, ansi: boolean = false): string
	{
		if (ping === -1)
		{
			return ansi
				? Markdown.ansi("N/A", AnsiFg.Cyan, AnsiStyle.Bold)
				: "N/A";
		}

		if (!ansi) return `${ping}ms`;

		if (ping <= 100)
		{
			return Markdown.ansi(`${ping}ms`, AnsiBrightFg.Green);
		}
		if (ping <= 200)
		{
			return Markdown.ansi(`${ping}ms`, AnsiFg.Yellow);
		}
		if (ping > 201)
		{
			return Markdown.ansi(`${ping}ms`, AnsiFg.Red, AnsiStyle.Bold);
		}
		return Markdown.ansi(`${ping}ms`, AnsiStyle.Bold, AnsiBrightFg.Red);
	}

	/**
	 * Formats text into a Discord code block.
	 */
	static codeBlock(text: string, language?: Language | string): string
	{
		if (!text)
		{
			return "";
		}

		if (language)
		{
			return `\`\`\`${language}\n${text}\n\`\`\``;
		}

		return `\`\`\`\n${text}\n\`\`\``;
	}

	/**
	 * Formats text to an url, hence called a masked link.
	 */
	static maskedLink(text: string, url: string): string
	{
		return `[${text}](${url})`;
	}

	/**
	 * Converts various inputs to a Discord Unix Timestamp.
	 * @param input Date object, ms timestamp, or a date string
	 * @param style The display style
	 */
	static timestamp(
		input: Date | number | string = new Date(),
		style: TimestampStyle = TimestampStyle.ShortDateTime
	): string
	{
		const date = new Date(input);

		if (isNaN(date.getTime()))
		{
			console.error(`Invalid date provided to formatter: ${input}`);
			return "`Invalid Date`";
		}

		const seconds = Math.floor(date.getTime() / 1000);
		return `<t:${seconds}:${style}>`;
	}

	/**
	 * Helper to quickly create a timestamp relative to "now"
	 * @param amount The number of units
	 * @param unit The time unit
	 */
	static relative(
		amount: number,
		unit: "seconds" | "minutes" | "hours" | "days" = "minutes"): string
	{
		const msPerUnit = {
			seconds: 1000,
			minutes: 60000,
			hours: 3600000,
			days: 86400000
		};

		const futureDate = Date.now() + (amount * msPerUnit[ unit ]);
		return this.timestamp(futureDate, TimestampStyle.Relative);
	}
}