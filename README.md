# OgarII

This is a full rewrite based off of Ogar/MultiOgar/MultiOgar-Edited that ended up being better than I originally expected. The code is clean and logical. The agar protocol is fully supported - up from version 4 all the way to 17.

## Running

1. DEV: docker-compose build && docker-compose up

## Configuring

- `cli/settings.json` is the way to go.

- To change logging settings, modify `cli/log-settings.json`.

## Expanding

- To add your own commands, check out `src/Commands.js` on the command API, then use the `ServerHandle.commands.register` function to finally add it. They can be added no matter whether the handle's running or not.

- A similar principle works for gamemodes, except that you'd need to inherit `src/Gamemode.js`'s `Gamemode` abstract class, modify the gamemode's functions to your wish, then use `ServerHandle.gamemodes.register` to add your gamemode **before** the handle starts.

- The `ServerHandle` class is standalone, which means that you can completely ditch the `cli/` folder and build your own logging system, or go even further and make a handle for running multiple servers simultaneously and sharing a common statistics endpoint.

## Questions

Ask questions about running, modifying & expanding in the [Agar.io Private Servers guild](https://discord.gg/27v68Sb).

**DON'T** ask what additional features will it bring.

**DON'T** go around asking ME how do I do this how do I do that. I'm not the Red Cross, nor your personal tech assistant, nor your paid developer.

## Contributing

Pull requests are not welcome.
