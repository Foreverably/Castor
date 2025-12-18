import fs from 'fs';
import path from 'path';

/**
 * Recursively loads command modules from a directory.
 * Returns an array of { filePath, module, data } objects and an array of JSON-ready command data.
 */
export async function loadCommandsFromDir(commandsDir)
{
	const commands = [];
	const commandsJson = [];

	async function walk(dir)
	{
		const entries = fs.readdirSync(dir, { withFileTypes: true });
		for (const entry of entries)
		{
			const full = path.join(dir, entry.name);
			if (entry.isDirectory())
			{
				await walk(full);
			} else if (entry.isFile() && (full.endsWith('.js') || full.endsWith('.mjs') || full.endsWith('.cjs')))
			{
				try
				{
					const mod = await import(full);
					const data = mod.data ?? mod.default?.data;
					if (data)
					{
						commands.push({ filePath: full, module: mod, data });
						commandsJson.push(data.toJSON ? data.toJSON() : data);
					}
				} catch (err)
				{
					console.warn(`Failed to import command ${full}:`, err.message || err);
				}
			}
		}
	}

	try
	{
		await walk(commandsDir);
	} catch (err)
	{
		console.warn(`Failed to read commands directory ${commandsDir}:`, err.message || err);
	}

	return { commands, commandsJson };
}
