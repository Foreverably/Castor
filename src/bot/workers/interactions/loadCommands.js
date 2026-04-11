import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

export async function loadCommandsFromDir(commandsDir)
{
	const commands = [];
	const commandsJson = [];

	async function walk(dir)
	{
		try
		{
			const entries = await fs.promises.readdir(dir, { withFileTypes: true });

			await Promise.all(
				entries.map(async (entry) =>
				{
					const fullPath = path.join(dir, entry.name);

					if (entry.isDirectory())
					{
						return walk(fullPath);
					}

					if (entry.isFile() && /\.(js|mjs|cjs)$/.test(entry.name))
					{
						try
						{
							const fileUrl = pathToFileURL(fullPath).href;
							const mod = await import(fileUrl);

							const exported = mod.default ?? mod;
							const commandData = exported.data;

							const defaultConstraints = {
								isVIP: false,
								hasFunCommands: false,
								isStaff: false,
								isSrMod: false,
								isAdmin: false,
								hasDevelopmentRole: false
							};

							if (commandData)
							{
								const builder = commandData.options;

								if (builder && typeof builder.setName === "function")
								{
									const commandDefinedConstraints =
										commandData.constraints || {};

									const finalConstraints = {
										...defaultConstraints,
										...commandDefinedConstraints
									};

									if (!Object.hasOwn(commandData, "constraints"))
									{
										Object.defineProperty(commandData, "constraints", {
											value: finalConstraints,
											writable: true,
											enumerable: true,
											configurable: false
										});
									}

									if (commandData.options)
									{
										if (commandData.name)
										{
											builder.setName(commandData.name);
										}
										if (commandData.description)
										{
											builder.setDescription(commandData.description);
										}
									}
								}

								const finalJson =
									builder && typeof builder.toJSON === "function"
										? builder.toJSON()
										: commandData;

								commands.push({
									filePath: fullPath,
									module: mod,
									data: commandData
								});
								commandsJson.push(finalJson);
							}
						}
						catch (err)
						{
							console.warn(
								`Failed to import command ${fullPath}:`,
								err.message || err
							);
						}
					}
				})
			);
		}
		catch (err)
		{
			console.warn(`Failed to read directory ${dir}:`, err.message || err);
		}
	}

	await walk(commandsDir);
	return { commands, commandsJson };
}
