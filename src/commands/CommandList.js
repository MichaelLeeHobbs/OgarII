/**
 * @typedef {(handle: ServerHandle, context: any, args: String[]) => void} CommandExecutor
 */

class Command {
    /**
     * @param {String} name
     * @param {String} description
     * @param {String} args
     * @param {CommandExecutor} executor 
     */
    constructor(name, description, args, executor) {
        this.name = name.toLowerCase();
        this.description = description;
        this.args = args;
        this.executor = executor;
    }

    toString() {
        return `${this.name}${!this.args ? "" : " " + this.args} - ${this.description}`;
    }
}

class CommandList {
    constructor(handle) {
        this.handle = handle;
        /** @type {{[commandName: string]: Command}} */
        this.list = { };
    }

    /**
     * @param {Command[]} commands
     */
    register(...commands) {
        for (let i = 0, l = commands.length; i < l; i++) {
            const command = commands[i];
            if (this.list.hasOwnProperty(command)) throw new Error("command conflicts with another already registered one");
            this.list[command.name] = command;
        }
    }

    /**
     * @param {any} context
     * @param {String} input
     */
    execute(context, input) {
        const split = input.split(" ");
        if (split.length === 0) return false;
        if (!this.list.hasOwnProperty(split[0].toLowerCase())) return false;
        this.list[split[0].toLowerCase()].executor(this.handle, context, split.slice(1));
        return true;
    }
}

module.exports = {
    Command: Command,
    CommandList: CommandList,
    /**
     * Generates a command.
     * @param {String} name
     * @param {String} desc
     * @param {String} args
     * @param {CommandExecutor} exec
     * @returns {Command}
     */
    genCommand({name, desc, args, exec}) {
        return new Command(name, desc, args, exec);
    }
};

const ServerHandle = require("../ServerHandle");