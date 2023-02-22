# ShadowrunBot

A matchmaking bot designed to allow players to queue up and find evenly matched games based on MMR/ELO rating.

## Installation

Install [node](https://nodejs.org/en/download/) Use the package manager npm to install packages from the package.json.

```bash
npm install
```
Create a bot in the [discord developer portal](https://discord.com/developers).

Create a free [mongodb](https://cloud.mongodb.com/) database 

Create a file named `.env` in the root directory and add the following items.
```properties
token=
clientId=
guildId=
databaseToken=
```

## Usage

```bash
npm run start
```

## Commands
 - **`/srinitialize`**

   Creates needed categories and channels for the discord bot.

- **`/queue`**

   Creates the queue in the queue channel for ranked or unranked.

## Contributing

Pull requests are welcome for contributions to the bot in the [This is Shadowrun](https://discord.gg/shadowrun) discord server only. Otherwise, fork for your own matchmaking bot.

For major changes, please open an issue first to discuss what you would like to change.