const fs = require("fs");
const LogHander = require("./log-handler")
const fetch = require('node-fetch')
const DefaultSettings = require("../datafiles/Settings");
const ServerHandle = require("../src/ServerHandle");
const {genCommand} = require("../src/commands/CommandList");
const readline = require("readline");

function commandListener(currentHandle) {
    let handler = setInterval(async () => {
        console.log(`Polling controller`)
        let serverData = await fetch('http://controller:8080/api/servers?id=1')
            .then(res => res.json())
            .catch((error) => console.error('Failed to load sever data!', error))
        console.log(`serverData: `, serverData)
        if (serverData.command === 'restart') {
            await fetch('http://controller:8080/api/servers?id=1&command=none&status=running', {method: 'PUT'})
                .catch((error) => console.error('Failed to set sever data!', error))
            currentHandle.stop()
            process.exitCode = 0;
            clearInterval(handler)
            setTimeout(process.exit, 5000)

            // setTimeout(async ()=>{
            //     let settings = readSettings()
            //     console.log(settings)
            //     currentHandle = initServer(settings)
            //     logger = currentHandle.logger
            //     currentHandle.start()
            //
            //     await fetch('http://controller:8080/api/servers?id=1&command=none&status=running', {method: 'PUT'})
            //         .catch((error) => console.error('Failed to set sever data!', error))
            // },5000)

        }
    }, 10 * 1000)
}

async function setStatus(status) {
    await fetch(`http://controller:8080/api/servers?id=1&status=${status}`, {method: 'PUT'})
        .catch((error) => console.error('Failed to set sever status!', error))
}

/** @returns {DefaultSettings} */
async function readSettings() {
    return await fetch('http://controller:8080/api/settings')
        .then(res => res.json())
        .then(res => {
            let settings = {}
            res.forEach(({key, value}) => settings[key] = value)
            console.log({settings})
            return settings
        })
        .then((settings) => ({...DefaultSettings, ...settings}))
        .catch((error) => {
            console.error('Failed to load settings from controller!', error)
            return readSettings()
        })
}

let commandStreamClosing = false;
const commandStream = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    prompt: "",
    historySize: 64,
    removeHistoryDuplicates: true
});

function initServer(settings) {
    let currentHandle = new ServerHandle(settings);
    LogHander(currentHandle);
    commandListener(currentHandle)
    return currentHandle
}

readSettings()
    .then((settings) => {
        // let currentHandle = new ServerHandle(settings);
        // LogHander(currentHandle);
        // commandListener(currentHandle)
        // let logger = currentHandle.logger;

        let currentHandle = initServer(settings)
        let logger = currentHandle.logger

        function ask() {
            if (commandStreamClosing) return;
            commandStream.question("@ ", (input) => {
                if (!(input = input.trim())) return;
                logger.printFile(`@ ${input}`);
                if (!currentHandle.commands.execute(null, input))
                    logger.warn(`unknown command ${input}`);
                process.nextTick(ask);
            });
        }

        logger.inform("command stream open");
        setTimeout(ask, 1000);
        process.once("SIGINT", () => {
            logger.inform("(caught SIGINT)");
            currentHandle.stop();
            process.exitCode = 0;
        });

        currentHandle.commands.register(
            genCommand({
                name: "exit",
                args: "",
                desc: "stop the handle and close the command stream",
                exec: (handle, context, args) => {
                    handle.stop();
                    commandStream.close();
                    commandStreamClosing = true;
                }
            }),
            genCommand({
                name: "reload",
                args: "",
                desc: "reload the settings from local settings.json",
                exec: (handle, context, args) => {
                    handle.setSettings(readSettings());
                    logger.print("done");
                }
            }),
            genCommand({
                name: "save",
                args: "",
                desc: "save the current settings to settings.json",
                exec: (handle, context, args) => {
                    overwriteSettings(handle.settings);
                    logger.print("done");
                }
            }),
        );

        currentHandle.start();
        setStatus('running')
    })

