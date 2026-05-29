export function Delay(ms: number): Promise<void>
{
	return new Promise(resolve => setTimeout(resolve, ms));
}