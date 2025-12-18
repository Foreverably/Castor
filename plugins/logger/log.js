const errorPrefix = "ERROR";
const logPrefix = "LOG";

/**
 * Error Logger.
 * @param message The message to put, this is optional due to a default value existing. "An unknown error has occurred"
 */
export function error(message = "An unknown error has occurred")
{
	return `(${errorPrefix}) ${message}`;
}

/**
 * Default Logger.
 * @param message The message to put
 */
export function log(message = "malformed function caught")
{
	if (message === "malformed function caught")
	{ // checks if this string is exact.
		console.error(`An error occurred while executing function: log()\nDid you forget the message? (Error occurs as no message is present, this is the most likely cause.)`);
		return;
	}
	return `(${logPrefix})` + message;
}