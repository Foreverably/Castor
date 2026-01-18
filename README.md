<p align="center"><img src="https://github.com/Foreverably/Castor/blob/main/.github/19c3414db6b1e74d6f0582eec86965ee.png?raw=true" alt="castor" width="256""></p>
<h1 align="center">Castor</h1> 
A fun Discord bot based off of KSJaay's Castor (https://github.com/KSJaay/Alita/tree/Castor). Completely rewritten from the ground up!<br>Made for the No Text to Speech Discord Server (https://discord.gg/ntts)
<br></br>
This project is licensed under the MIT License; see LICENSE for details.

---

# Getting Started
1. Clone (or fork) the repository
2. Copy contents from `.env.example` to a new file called `.env`

## Development
This assumes that you are already inside of the project directory. Below is the most basic way to set-up Castor.
```zsh
npm install
node index.js
```

Next, you need to make a MongoDB server. You can do so at https://cloud.mongodb.com/ and then copy the connection url.

The Jasper API key requires hosting the Go webserver from https://github.com/JayyDoesDev/jasper/tree/main/apps/webserverGo and obtaining the api key.

Lastly, make sure you have two bots for development and production. You can swap between bots inside of `config.js`

---
## Contributors
<a href="https://github.com/Foreverably/Castor/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Foreverably/Castor" />
</a>
