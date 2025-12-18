import { ApplicationCommandType, AttachmentBuilder, ContextMenuCommandBuilder } from "discord.js";
import { renderRawHtml } from "../../../web/messageRenderer.js";
import { Flags } from "../../../plugins/flags/message.js";
import { Precondition } from "../../../plugins/preconditions/precondition.js";

export const data = new ContextMenuCommandBuilder()
	.setName("Make it a Quote")
	.setType(ApplicationCommandType.Message);

function generateQuoteHtml(username, quoteText, avatarURL, quoteFontSize)
{
	const safeQuote = quoteText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	const safeUser = username.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

	const style = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;700&display=swap');
            
            body { 
                width: 1000px;
                height: 500px; 
                margin: 0; 
                background-color: #000000;
                position: relative; 
                overflow: hidden;
            }
            
            .pfp-image {
                position: absolute;
                top: 0;
                left: 0;
                width: 500px; 
                height: 500px;
                background-image: url('${avatarURL}'); 
                background-size: cover;
                background-position: center;
                filter: brightness(0.8) grayscale(100%); 
            }
            
            .gradient-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(to right, 
                    rgba(0, 0, 0, 0) 0%, 
                    rgba(0, 0, 0, 0.4) 15%, 
                    #000000 50%, 
                    #000000 100%
                );
            }

            .text-container {
                position: absolute;
                top: 0;
                right: 0; 
                width: 500px; 
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center; 
                align-items: center; 
                text-align: center;
                padding: 0; 
                z-index: 5; 
            }

            .quote-text {
                font-family: 'Roboto', sans-serif;
                font-weight: 600;
                font-size: ${quoteFontSize}px; 
                color: #ffffff;
                line-height: 1.3;
                max-width: 400px;
                margin: 0;
                text-align: center;
                text-shadow: 0 0 5px rgba(0, 0, 0, 0.5); 
            }
            .author {
                font-family: 'Roboto', sans-serif;
                font-weight: 300;
                font-size: 26px; 
                color: #a0a0a0;
                margin-top: 20px;
                text-align: center;
                
            }
            .credit {
                position: absolute;
                bottom: 10px;
                right: 10px;
                font-size: 14px;
                color: #444444; 
                z-index: 10;
            }
        </style>
    `;

	const htmlContent = `
        <!DOCTYPE html>
        <html>
            <head>
                ${style}
            </head>
            <body>
                <div class="pfp-image"></div>
                <div class="gradient-overlay"></div>
                <div class="text-container">
                    <div class="quote-text">
                        ${safeQuote}
                    </div>
                    <div class="author">
                        — ${safeUser}
                    </div>
                </div>
                <div class="credit">Make it a Quote via Castor</div>
            </body>
        </html>
    `;

	return htmlContent;
}


export async function execute(interaction)
{
	if (!Precondition.check.hasFunCommandAccess(interaction))
	{
		return Precondition.result.denied(interaction);
	}

	if (!interaction.isMessageContextMenuCommand()) return;

	const targetMessage = interaction.targetMessage;
	const quoteText = targetMessage.content;

	if (targetMessage.author.bot || !quoteText.trim())
	{
		return interaction.reply({
			content: "Cannot quote bots or empty messages!",
			flags: Flags.EPHEMERAL
		});
	}

	await interaction.deferReply({});

	const timeout = setTimeout(() =>
	{
		if (interaction.replied || interaction.deferred)
		{
			interaction.editReply({
				content: "Quote generation timed out after 12 seconds."
			}).catch(() => {});
		}
	}, 12_000);

	try
	{
		let quoteFontSize = 46;
		const length = quoteText.length;

		if (length > 200)
		{
			quoteFontSize = 26;
		}
		else if (length > 100)
		{
			quoteFontSize = 34;
		}

		const avatarURL = targetMessage.author.displayAvatarURL({
			size: 512,
			extension: "png",
			forceStatic: true
		});

		const htmlContent = generateQuoteHtml(
			targetMessage.author.username,
			quoteText,
			avatarURL,
			quoteFontSize
		);

		const imageBuffer = await renderRawHtml(htmlContent, {
			width: 1000,
			height: 500
		});

		const attachment = new AttachmentBuilder(imageBuffer, { name: "quote.png" });

		await interaction.editReply({
			content: `-# **Quote by ${targetMessage.author} generated:**`,
			files: [ attachment ],
			allowedMentions: { parse: [ null ] }
		});
	}
	catch (error)
	{
		console.error("Quote command error:", error);

		let message = "Failed to create quote image.";
		if (error.name === "AbortError") message = "Avatar download timed out.";
		await interaction.editReply({
			content: message, flags: Flags.EPHEMERAL
		}).catch(() => {});
	}
	finally
	{
		clearTimeout(timeout);
	}
}