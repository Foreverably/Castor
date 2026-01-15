import puppeteer from "puppeteer";

async function renderDiscordMessages(messages)
{
	const browser = await puppeteer.launch({ headless: true, args: [ "--no-sandbox", "--disable-setuid-sandbox" ] });
	const page = await browser.newPage();
	await page.setViewport({ width: 800, height: 1024, deviceScaleFactor: 2 });

	let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script type="module" src="https://unpkg.com/wc-discord-message@^2.0.0/dist/wc-discord-message/wc-discord-message.js"></script>
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
      <style>
        body {
          background-color: #36393f;
          color: #dcddde;
          font-family: 'Roboto', sans-serif;
          padding: 20px;
        }
        discord-messages {
          display: block;
          max-width: 600px;
          margin: 0 auto;
        }
        .action-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }
        .discord-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: 'Roboto', sans-serif;
          font-weight: 500;
          font-size: 14px;
          padding: 0 16px;
          height: 38px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          color: #fff;
          min-width: 60px;
          box-sizing: border-box;
          box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
        }
        .discord-button.primary {
          background-color: #5865f2;
        }
        .discord-button.secondary {
          background-color: #4f545c;
        }
        .discord-button.success {
          background-color: #3ba55c;
        }
        .discord-button.danger {
          background-color: #ed4245;
        }
        .discord-button.link {
          background-color: #35393eff;
        }
      </style>
    </head>
    <body>
      <discord-messages>
  `;

	for (const msg of messages)
	{
		html += `
        <discord-message
          author="${msg.author || "User"}"
          avatar="${msg.avatar || "blue"}"
          bot="${!!msg.bot}"
          role-color="${msg.roleColor || ""}"
        >
          ${msg.content || ""}
    `;

		if (msg.embeds && msg.embeds.length > 0)
		{
			for (const embed of msg.embeds)
			{
				html += `
          <discord-embed slot="embeds" color="${embed.color || "#0099ff"}" author-name="${embed.author?.name || ""}" author-image="${embed.author?.iconURL || ""}" embed-title="${embed.title || ""}" thumbnail="${embed.thumbnail?.url || ""}" image="${embed.image?.url || ""}">
            ${embed.description || ""}
            ${embed.footer ? `<div slot="footer">${embed.footer.text}</div>` : ""}
          </discord-embed>
        `;
			}
		}

		if (msg.components && msg.components.length > 0)
		{
			for (const row of msg.components)
			{
				if (row.type === 1)
				{
					html += `<div class="action-row">`;
					for (const comp of row.components)
					{
						if (comp.type === 2)
						{
							let styleClass = "";
							switch (comp.style)
							{
								case 1:
									styleClass = "primary";
									break;
								case 2:
									styleClass = "secondary";
									break;
								case 3:
									styleClass = "success";
									break;
								case 4:
									styleClass = "danger";
									break;
								case 5:
									styleClass = "link";
									break;
								default:
									styleClass = "secondary";
							}
							html += `<button class="discord-button ${styleClass}">${comp.label || "Button"}</button>`;
						}
					}
					html += `</div>`;
				}
			}
		}

		html += `
        </discord-message>
    `;
	}

	html += `
      </discord-messages>
    </body>
    </html>
  `;

	await page.setContent(html, { waitUntil: "networkidle0" });

	const element = await page.$("discord-messages");
	const bb = await element.boundingBox();

	const buffer = await page.screenshot({
		clip: {
			x: bb.x,
			y: bb.y,
			width: bb.width,
			height: bb.height
		},
		type: "png",
		omitBackground: true
	});

	await browser.close();
	return buffer;
}

/**
 * Renders raw HTML/CSS content using Puppeteer for custom graphics.
 * @param {string} htmlContent; the full HTML string to render.
 * @param {object} dimensions { width: number, height: number } for the viewport.
 * @returns {Promise<Buffer>} The PNG buffer.
 */
async function renderRawHtml(htmlContent, dimensions = { width: 1000, height: 500 })
{
	const browser = await puppeteer.launch({ headless: true, args: [ "--no-sandbox", "--disable-setuid-sandbox" ] });
	const page = await browser.newPage();

	await page.setViewport({
		width: dimensions.width,
		height: dimensions.height,
		deviceScaleFactor: 2
	});

	await page.setContent(htmlContent, { waitUntil: "networkidle0" });

	const buffer = await page.screenshot({
		fullPage: true,
		type: "png"
	});

	await browser.close();
	return buffer;
}

export { renderDiscordMessages, renderRawHtml };