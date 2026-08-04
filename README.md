<p align="center">
  <img src="https://github.com/Foreverably/Castor/blob/main/.github/19c3414db6b1e74d6f0582eec86965ee.png?raw=true" alt="castor" width="256">
</p>

<h1 align="center">Castor</h1>

<p align="center">
  <img src="https://img.shields.io/badge/version-3.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/TypeScript-5.3-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/discord.js-14.23-5865F2" alt="Discord.js">
</p>

A fun Discord bot based off of [KSJaay's Castor](https://github.com/KSJaay/Alita/tree/Castor) but completely rewritten in TypeScript with a lot more features. This was primarily made for the [No Text To Speech](https://discord.gg/ntts) server.

## Features

### Games & Entertainment

- **8Ball** - Ask the magic 8ball a question
- **Coin Flip** - Flip a coin for heads or tails
- **Dice** - Roll dice with custom sides
- **Slots** - Play a slot machine game
- **Tic Tac Toe** - Play tic-tac-toe against friends
- **Rock Paper Scissors** - Classic RPS game
- **Leaderboard** - View game leaderboards

### Fun Commands

- **Dad Jokes** - Get random dad jokes from the database
- **Meme Generator** - Add Impact font text to images (top/bottom)
- **Caption** - Add captions to images
- **Speech Bubble** - Add speech bubbles to images
- **Act** - Roleplay actions

### Utility

- **Ping** - Check bot latency
- **Browser** - Test browserless connection
- **Settings** - Configure bot settings per server

### Staff Commands

- **Manage Jokes** - Add/remove dad jokes from the database
- **Migrate Jokes** - Migrate jokes between databases

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Discord Library**: discord.js v14.23
- **Databases**:
    - MongoDB (user data)
    - MariaDB (jokes, configuration)
- **Image Processing**:
    - Playwright-core (browser automation)
    - Sharp (image manipulation & "togif" support)
    - Browserless (chrome endpoint)
- **Build Tools**: TypeScript, tsc-alias

## Architecture

The bot uses a modular command structure with:

- **Handlers**: Event, command, interaction, and error handlers
- **Commands**: Organized by category (vip, restricted, staff, utility, settings)
- **Structures**: Base classes for commands, events, and client extension
- **Utils**: Helper functions for games, components, logging, and database operations

## Prerequisites

- Node.js (v18 or higher recommended)
- [Browserless](https://www.browserless.io/) endpoint with chrome
- MongoDB database (Atlas or self-hosted)
- MariaDB database

## Installation

1. Clone the repository:

```bash
git clone https://github.com/Foreverably/Castor.git
cd Castor
```

2. Install dependencies:

```bash
npm install
```

3. Copy environment variables:

```bash
cp example.env .env
```

4. Fill in your [.env](cci:7://file:///Users/forwynn/Documents/Projects/Bots/CastorV3/.env:0:0-0:0) file with the required values (see [Environment Variables](#environment-variables))

5. Build the project:

```bash
npm run build
```

## Development

### Running in Development Mode

```bash
npm run nodemon:dev
```

### Deploying Commands (Development)

```bash
npm run dev:deploy
```

### Watch Mode

```bash
npm run watch
```

## Production Deployment

It is preferred to use Docker or a deployment platform like [Coolify](https://coolify.io/) to host Castor. The project is designed to work with Coolify's Traefik proxy configuration.

### Building for Production

```bash
npm run build
```

### Starting the Bot

```bash
npm start
```

### Deploying Commands (Production)

```bash
npm run start:deploy
```

## Environment Variables

Copy the `.env.example` file to [.env](cci:7://file:///Users/forwynn/Documents/Projects/Bots/CastorV3/.env:0:0-0:0) and fill in the values:

```env
# Discord / Client
DISCORD_TOKEN=
CLIENT_ID=
GUILD_ID=
DEBUG=true
PREFIX=c?

# Gateway Intents (must match what's enabled in the Discord Developer Portal)
# Message Content is privileged: default OFF. Set INTENT_MESSAGE_CONTENT=true only
# after re-enabling it in the portal, otherwise bot login fails with "Used disallowed intents".
INTENT_GUILDS=true
INTENT_GUILD_MESSAGES=false
INTENT_MESSAGE_CONTENT=false
INTENT_GUILD_MESSAGE_REACTIONS=false

# Developer Configuration
DEVELOPER_IDS=

# Logging Configuration
LOG_LEVEL=debug

# Database
MONGODB_URI=
MARIADB_URI=

# Playwright config
BROWSER_WS_ENDPOINT=

# Channels
ERROR_LOG_CHANNEL_ID=
```

## Command Categories

Commands are organized by access level:

- **VIP**: Available to VIP members in designated channels
- **Restricted**: Limited access commands (levels, staff, etc.)
- **Staff**: Admin-only commands
- **Utility**: General utility commands
- **Settings**: Server configuration commands

## Troubleshooting

### Common Issues

> **Bot won't start**
>
> - Ensure all environment variables are set
> - Check that MongoDB and MariaDB are accessible
> - Verify the Discord token is valid

> **Image commands not working**
>
> - Ensure `BROWSER_WS_ENDPOINT` is set correctly
> - Check that Browserless is running and accessible
> - Verify Playwright-core is installed

> **Commands not deploying**
>
> - Ensure `CLIENT_ID` and `GUILD_ID` are correct
> - Check that the bot has the `applications.commands` scope

## Contributing

Pull requests are welcome! Please ensure:

- Code follows the existing style (Prettier configured)
- TypeScript types are properly defined
- Commands include proper error handling
- Tests are added for new features (if applicable)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Based on [KSJaay's Castor](https://github.com/KSJaay/Alita/tree/Castor)
- Originally built for the [No Text To Speech](https://discord.gg/ntts) community
- Built on top of [discord.js](https://discord.js.org/)
