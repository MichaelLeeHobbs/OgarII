const QuadTree = require("../primitives/QuadTree");

const Minion = require("../bots/Minion");
const PlayerBot = require("../bots/PlayerBot");

const Pellet = require("../cells/Pellet");
const EjectedCell = require("../cells/EjectedCell");
const PlayerCell = require("../cells/PlayerCell");
const Mothercell = require("../cells/Mothercell");
const Virus = require("../cells/Virus");
const ChatChannel = require("../sockets/ChatChannel");

const { fullyIntersects } = require("../primitives/Misc");

/**
 * @typedef {{x: Number, y: Number}} Position
 * @typedef {{r: Number, g: Number, b: Number}} Color
 * @typedef {{x: Number, y: Number, w: Number, h: Number}} Range
 */

class World {
    /**
     * @param {ServerHandle} handle
     * @param {Number} id
     */
    constructor(handle, id) {
        this.handle = handle;
        this.id = id;

        this.frozen = false;

        this._nextCellId = 1;
        /** @type {Cell[]} */ this.cells = [];
        /** @type {Cell[]} */ this.boostingCells = [];
        this.pelletCount = 0;
        this.mothercellCount = 0;
        this.virusCount = 0;
        /** @type {EjectedCell[]} */ this.ejectedCells = [];
        /** @type {PlayerCell[]} */ this.playerCells = [];

        /** @type {Player[]} */ this.players = [];
        /** @type {Player=} */ this.largestPlayer = null;
        this.worldChat = new ChatChannel(this.handle);

        /** @type {Range} */ this.border = { x: NaN, y: NaN, w: NaN, h: NaN };
        /** @type {QuadTree} */ this.finder = null;

        /**
         * @type {{limit: Number, internal: Number, external: Number, playing: Number, spectating: Number, name: String, gamemode: String, loadTime: Number, uptime: Number}}
         */
        this.stats = {
            limit: NaN,
            internal: NaN,
            external: NaN,
            playing: NaN,
            spectating: NaN,
            name: null,
            gamemode: null,
            loadTime: NaN,
            uptime: NaN
        };

        this.setBorder({ x: this.settings.mapX, y: this.settings.mapY, w: this.settings.mapW, h: this.settings.mapH });
    }

    get settings() { return this.handle.settings; }
    get nextCellId() {
        return this._nextCellId === 4294967296 ? (this._nextCellId = 1) : this._nextCellId++;
    }

    afterCreation() {
        for (let i = 0; i < this.settings.playerBotsPerWorld; i++)
            new PlayerBot(this);
    }
    destroy() {
        while (this.players.length > 0)
            this.removePlayer(this.players[0]);
        while (this.cells.length > 0)
            this.removeCell(this.cells[0]);
    }

    /** @param {{x: Number, y: Number, w: Number, h: Number}} range */
    setBorder(range) {
        this.border.x = range.x;
        this.border.y = range.y;
        this.border.w = range.w;
        this.border.h = range.h;
        if (this.finder !== null) this.finder.destroy();
        this.finder = new QuadTree(
            this.border,
            this.settings.finderMaxLevel,
            this.settings.finderMaxItems
        );
        for (let i = 0, l = this.cells.length; i < l; i++) {
            const cell = this.cells[i];
            if (cell.type === 0) continue;
            this.finder.insert(cell);
            if (!fullyIntersects(this.border, cell.range))
                this.removeCell(cell);
        }
    }

    /** @param {Cell} cell */
    addCell(cell) {
        cell.exists = true;
        cell.range = {
            x: cell.x,
            y: cell.y,
            w: cell.size,
            h: cell.size
        };
        this.cells.push(cell);
        this.finder.insert(cell);
        cell.onSpawned();
        this.handle.gamemode.onNewCell(cell);
    }
    /** @param {Cell} cell */
    setCellAsBoosting(cell) {
        if (cell.isBoosting) return false;
        cell.isBoosting = true;
        this.boostingCells.push(cell);
        return true;
    }
    /** @param {Cell} cell */
    setCellAsNotBoosting(cell) {
        if (!cell.isBoosting) return false;
        cell.isBoosting = false;
        this.boostingCells.splice(this.boostingCells.indexOf(cell), 1);
        return true;
    }
    /** @param {Cell} cell */
    updateCell(cell) {
        cell.range.x = cell.x;
        cell.range.y = cell.y;
        cell.range.w = cell.size;
        cell.range.h = cell.size;
        this.finder.update(cell);
    }
    /** @param {Cell} cell */
    removeCell(cell) {
        this.handle.gamemode.onCellRemove(cell);
        cell.onRemoved();
        this.finder.remove(cell);
        delete cell.range;
        this.setCellAsNotBoosting(cell);
        this.cells.splice(this.cells.indexOf(cell), 1);
        cell.exists = false;
    }

    /** @param {Player} player */
    addPlayer(player) {
        this.players.push(player);
        player.world = this;
        this.worldChat.add(player.router);
        this.handle.gamemode.onPlayerJoinWorld(player, this);
        player.router.onWorldSet();
        this.handle.logger.debug(`player ${player.id} has been added to world ${this.id}`);
        if (!player.router.isExternal) return;
        for (let i = 0; i < this.settings.minionsPerPlayer; i++)
            new Minion(player.router);
    }
    /** @param {Player} player */
    removePlayer(player) {
        this.players.splice(this.players.indexOf(player), 1);
        this.handle.gamemode.onPlayerLeaveWorld(player, this);
        player.world = null;
        this.worldChat.remove(player.router);        
        while (player.ownedCells.length > 0)
            this.removeCell(player.ownedCells[0]);
        player.router.onWorldReset();
        this.handle.logger.debug(`player ${player.id} has been removed from world ${this.id}`);
    }

    /**
     * @param {Number} cellSize
     * @returns {Position}
     */
    getRandomPos(cellSize) {
        return {
            x: this.border.x - this.border.w + cellSize + Math.random() * (2 * this.border.w - cellSize),
            y: this.border.y - this.border.h + cellSize + Math.random() * (2 * this.border.h - cellSize),
        };
    }
    /**
     * @param {Range} range
     */
    isSafeSpawnPos(range) {
        return !this.finder.containsAny(range, /** @param {Cell} other */ (item) => item.avoidWhenSpawning);
    }
    /**
     * @param {Number} cellSize
     * @returns {Position}
     */
    getSafeSpawnPos(cellSize) {
        let tries = this.settings.safeSpawnTries;
        while (--tries >= 0) {
            const pos = this.getRandomPos(cellSize);
            if (this.isSafeSpawnPos({ x: pos.x, y: pos.y, w: cellSize, h: cellSize }))
                return pos;
        }
        return this.getRandomPos(cellSize);
    }
    /**
     * @param {Number} cellSize
     * @returns {{color: Color, pos: Position}}
     */
    getPlayerSpawn(cellSize) {
        if (this.settings.safeSpawnFromEjected > Math.random() && this.ejectedCells.length > 0) {
            let tries = this.settings.safeSpawnTries;
            while (--tries >= 0) {
                const cell = this.ejectedCells[~~(Math.random() * this.ejectedCells.length)];
                if (this.isSafeSpawnPos({ x: cell.x, y: cell.y, w: cellSize, h: cellSize })) {
                    this.removeCell(cell);
                    return { color: cell.color, pos: { x: cell.x, y: cell.y } };
                }
            }
        }
        return { color: null, pos: this.getSafeSpawnPos(cellSize) };
    }

    /**
     * @param {Player} player
     * @param {Color} color
     * @param {Position} pos
     * @param {Number} size
     * @param {String} name
     * @param {String} skin
     */
    spawnPlayer(player, color, pos, size, name, skin) {
        const playerCell = new PlayerCell(player, pos.x, pos.y, size, color, name, skin);
        this.addCell(playerCell);
        player.updateState(0);
    }

    update() {
        this.handle.gamemode.onWorldTick(this);

        if (this.frozen) {
            for (let i = 0, l = this.players.length; i < l; i++) {
                const router = this.players[i].router;
                router.splitAttempts = 0;
                router.ejectAttempts = 0;
                if (router.isPressingQ) {
                    if (!router.hasProcessedQ)
                        router.onQPress();
                    router.hasProcessedQ = true;
                } else router.hasProcessedQ = false;
                router.requestingSpectate = false;
                router.spawningName = null;
            }
            return;
        }

        const self = this;
        const eat = [], rigid = [];
        let i, l;

        // fire cell onTick
        for (i = 0, l = this.cells.length; i < l; i++)
            this.cells[i].onTick();
        
        // spawn passives
        while (this.pelletCount < this.settings.pelletCount) {
            const pos = this.getSafeSpawnPos(this.settings.pelletMinSize);
            this.addCell(new Pellet(this, this, pos.x, pos.y));
        }
        while (this.virusCount < this.settings.virusMinCount) {
            const pos = this.getSafeSpawnPos(this.settings.virusSize);
            this.addCell(new Virus(this, pos.x, pos.y));
        }
        while (this.mothercellCount < this.settings.mothercellCount) {
            const pos = this.getSafeSpawnPos(this.settings.mothercellSize);
            this.addCell(new Mothercell(this, pos.x, pos.y));
        }
        
        // boosting cell updates
        for (i = 0, l = this.boostingCells.length; i < l;) {
            if (!this.boostCell(this.boostingCells[i])) l--;
            else i++;
        }

        // boosting cell checks
        for (i = 0; i < this.boostingCells.length; i++) {
            const cell = this.boostingCells[i];
            if (cell.type !== 2 && cell.type !== 3) continue;
            this.finder.search(cell.range, /** @param {Cell} other */ (other) => {
                if (cell.id === other.id) return;
                switch (cell.getEatResult(other)) {
                    case 1: rigid.push(cell, other); break;
                    case 2: eat.push(cell, other); break;
                    case 3: eat.push(other, cell); break;
                }
            });
        }

        // player cell updates        
        for (i = 0, l = this.playerCells.length; i < l; i++) {
            const cell = this.playerCells[i];
            this.autosplitPlayerCell(cell);
            this.movePlayerCell(cell);
            this.decayPlayerCell(cell);
            this.bounceCell(cell);
            this.updateCell(cell);
        }

        // player cell checks
        for (i = 0; i < l; i++) {
            const cell = this.playerCells[i];
            this.finder.search(cell.range, /** @param {Cell} other */ (other) => {
                if (cell.id === other.id) return;
                switch (cell.getEatResult(other)) {
                    case 1: rigid.push(cell, other); break;
                    case 2: eat.push(cell, other); break;
                    case 3: eat.push(other, cell); break;
                }
            });
        }

        // resolve rigids
        for (i = 0, l = rigid.length; i < l;)
            this.resolveRigidCheck(rigid[i++], rigid[i++]);

        // resolve eats
        for (i = 0, l = eat.length; i < l;)
            this.resolveEatCheck(eat[i++], eat[i++]);

        // update players
        this.largestPlayer = null;
        for (i = 0, l = this.players.length; i < l; i++) {
            const player = this.players[i];
            player.checkDisconnect();
            if (!player.exists) { i--; l--; continue; }
            const router = player.router;
            while (router.splitAttempts > 0) {
                router.attemptSplit();
                router.splitAttempts--;
            }
            if (router.ejectAttempts > 0) {
                router.attemptEject();
                router.ejectAttempts = 0;
            }
            if (router.isPressingQ) {
                if (!router.hasProcessedQ)
                    router.onQPress();
                router.hasProcessedQ = true;
            } else router.hasProcessedQ = false;
            if (router.requestingSpectate) {
                router.onSpectateRequest();
                router.requestingSpectate = false;
            }
            if (router.spawningName !== null) {
                router.onSpawnRequest();
                router.spawningName = null;
            }
            player.updateViewArea();
            if (!isNaN(player.score) && (this.largestPlayer === null || player.score > this.largestPlayer.score))
                this.largestPlayer = player;
        }
        this.compileStatistics();
        this.handle.gamemode.compileLeaderboard(this);

        if (this.stats.external <= 0) this.handle.removeWorld(this.id);
    }

    /**
     * @param {Cell} a
     * @param {Cell} b
     */
    resolveRigidCheck(a, b) {
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d = Math.sqrt(dx * dx + dy * dy);
        if (d <= 0) return;
        const m = a.size + b.size - d;
        if (m <= 0) return; dx /= d; dy /= d;
        const M = a.squareSize + b.squareSize;
        const aM = b.squareSize / M;
        const bM = a.squareSize / M;
        a.x -= dx * m * aM;
        a.y -= dy * m * aM;
        b.x += dx * m * bM;
        b.y += dy * m * bM;
        this.bounceCell(a);
        this.bounceCell(b);
        this.updateCell(a);
        this.updateCell(b);
    }

    /**
     * @param {Cell} a
     * @param {Cell} b
     */
    resolveEatCheck(a, b) {
        if (!a.exists || !b.exists) return;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > a.size - b.size / 3) return;
        if (!this.handle.gamemode.canEat(a, b)) return;
        a.whenAte(b);
        b.whenEatenBy(a);
        this.removeCell(b);
        this.updateCell(a);
    }

    /** @param {Cell} cell */
    boostCell(cell) {
        const d = cell.boost.d / 9 * this.handle.stepMult;
        cell.x += cell.boost.dx * d;
        cell.y += cell.boost.dy * d;
        this.bounceCell(cell, true);
        this.updateCell(cell);
        if ((cell.boost.d -= d) >= 1) return true;
        this.setCellAsNotBoosting(cell);
        return false;
    }

    /**
     * @param {Cell} cell
     * @param {Boolean=} bounce
    */
    bounceCell(cell, bounce) {
        const r = cell.size / 2;
        const b = this.border;
        if (cell.x <= b.x - b.w + r) {
            cell.x = b.x - b.w + r;
            if (bounce) cell.boost.dx = -cell.boost.dx;
        }
        if (cell.x >= b.x + b.w - r) {
            cell.x = b.x + b.w - r;
            if (bounce) cell.boost.dx = -cell.boost.dx;
        }
        if (cell.y <= b.y - b.h + r) {
            cell.y = b.y - b.h + r;
            if (bounce) cell.boost.dy = -cell.boost.dy;
        }
        if (cell.y >= b.y + b.h - r) {
            cell.y = b.y + b.h - r;
            if (bounce) cell.boost.dy = -cell.boost.dy;
        }
    }

    /** @param {Virus} virus */
    splitVirus(virus) {
        const newVirus = new Virus(this, virus.x, virus.y);
        newVirus.boost.dx = virus.boost.dx;
        newVirus.boost.dy = virus.boost.dy;
        newVirus.boost.d = this.settings.virusSplitBoost;
        this.addCell(newVirus);
        this.setCellAsBoosting(newVirus);
    }

    /** @param {PlayerCell} cell */
    movePlayerCell(cell) {
        const router = cell.owner.router;
        if (router.disconnected) return;
        let dx = router.mouseX - cell.x;
        let dy = router.mouseY - cell.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 1) return; dx /= d; dy /= d;
        const m = Math.min(cell.moveSpeed, d) * this.handle.stepMult;
        cell.x += dx * m;
        cell.y += dy * m;
    }
    /** @param {PlayerCell} cell */
    decayPlayerCell(cell) {
        const newSize = cell.size - cell.size * this.handle.gamemode.getDecayMult(cell) / 50 * this.handle.stepMult;
        cell.size = Math.max(newSize, this.settings.playerMinSize);
    }
    /**
     * @param {PlayerCell} cell
     * @param {Number} size
     * @param {{dx: Number, dy: Number, d: Number}} boost
     */
    launchPlayerCell(cell, size, boost) {
        cell.squareSize -= size * size;
        const newCell = new PlayerCell(cell.owner, cell.x, cell.y, size, cell.color, cell.name, cell.skin);
        newCell.boost.dx = boost.dx;
        newCell.boost.dy = boost.dy;
        newCell.boost.d = boost.d;
        this.addCell(newCell);
        this.setCellAsBoosting(newCell);
    }
    /** @param {PlayerCell} cell */
    autosplitPlayerCell(cell) {
        const minSplit = this.settings.playerMaxSize * this.settings.playerMaxSize;
        const cellsLeft = this.settings.playerMaxCells - cell.owner.ownedCells.length;
        const overflow = Math.ceil(cell.squareSize / minSplit);
        if (overflow === 1) return;
        const splitTimes = Math.min(overflow, cellsLeft);
        const splitSize = Math.min(Math.sqrt(cell.squareSize / splitTimes), this.settings.playerMaxSize);
        for (let i = 1; i < splitTimes; i++) {
            const angle = Math.random() * 2 * Math.PI;
            this.launchPlayerCell(cell, splitSize, {
                dx: Math.sin(angle),
                dy: Math.cos(angle),
                d: this.settings.playerSplitBoost
            });
        }
        cell.size = splitSize;
    }

    /** @param {Player} player */
    splitPlayer(player) {
        const router = player.router;
        const l = player.ownedCells.length;
        for (let i = 0; i < l; i++) {
            if (player.ownedCells.length >= this.settings.playerMaxCells)
                break;
            const cell = player.ownedCells[i];
            if (cell.size < this.settings.playerMinSplitSize)
                continue;
            let dx = router.mouseX - cell.x;
            let dy = router.mouseY - cell.y;
            let d = Math.sqrt(dx * dx + dy * dy);
            if (d < 1) dx = 1, dy = 0, d = 1;
            else dx /= d, dy /= d;
            this.launchPlayerCell(cell, cell.size / 1.4142135623730952, {
                dx: dx,
                dy: dy,
                d: this.settings.playerSplitBoost
            });
        }
    }
    /** @param {Player} player */
    ejectFromPlayer(player) {
        const dispersion = this.settings.ejectDispersion;
        const loss = this.settings.ejectingLoss * this.settings.ejectingLoss;
        const router = player.router;
        const l = player.ownedCells.length;
        for (let i = 0; i < l; i++) {
            const cell = player.ownedCells[i];
            if (cell.size < this.settings.playerMinEjectSize)
                continue;
            let dx = router.mouseX - cell.x;
            let dy = router.mouseY - cell.y;
            let d = Math.sqrt(dx * dx + dy * dy);
            if (d < 1) dx = 1, dy = 0, d = 1;
            else dx /= d, dy /= d;
            const sx = cell.x + dx * cell.size;
            const sy = cell.y + dy * cell.size;
            const newCell = new EjectedCell(this, sx, sy, cell.color);
            const a = Math.atan2(dx, dy) - dispersion + Math.random() * 2 * dispersion;
            newCell.boost.dx = Math.sin(a);
            newCell.boost.dy = Math.cos(a);
            newCell.boost.d = this.settings.ejectedCellBoost;
            this.addCell(newCell);
            this.setCellAsBoosting(newCell);
            cell.squareSize -= loss;
            this.updateCell(cell);
        }
    }

    /**
     * @param {PlayerCell} cell
     */
    popPlayerCell(cell) {
        const splits = this.distributeCellMass(cell);
        const angles = this.distributePopAngles(cell, splits);
        for (let i = 0, l = splits.length; i < l; i++) {
            this.launchPlayerCell(cell, splits[i], {
                dx: Math.sin(angles[i]),
                dy: Math.cos(angles[i]),
                d: this.settings.playerSplitBoost
            });
        }
    }

    /**
     * @param {PlayerCell} cell
     * @returns {Number[]}
     */
    distributeCellMass(cell) {
        const player = cell.owner;
        let cellsLeft = this.settings.playerMaxCells - player.ownedCells.length;
        if (cellsLeft <= 0) return [];
        let splitMin = this.settings.playerMinSplitSize;
        splitMin = splitMin * splitMin / 100;
        const cellMass = cell.mass;
        if (this.settings.virusMonotonePops) {
            const amount = Math.min(Math.floor(cellMass / splitMin), cellsLeft);
            const perPiece = cellMass / (amount + 1);
            return new Array(amount).fill(perPiece);
        }
        if (cellMass / cellsLeft < splitMin) {
            let amount = 2, perPiece = NaN;
            while ((perPiece = cellMass / (amount + 1)) >= splitMin && amount * 2 <= cellsLeft)
                amount *= 2;
            return new Array(amount).fill(perPiece);
        }
        const splits = [];
        let nextMass = cellMass / 2;
        let massLeft = cellMass / 2;
        while (cellsLeft > 0) {
            if (nextMass / cellsLeft < splitMin) break;
            while (nextMass >= massLeft && cellsLeft > 1)
                nextMass /= 2;
            splits.push(nextMass);
            massLeft -= nextMass;
            cellsLeft--;
        }
        nextMass = massLeft / cellsLeft;
        return splits.concat(new Array(cellsLeft).fill(nextMass));
    }

    /**
     * @param {Cell} cell
     * @param {Number[]} splits
     */
    distributePopAngles(cell, splits) {
        splits.sort((a, b) => Math.round(Math.random() * 3 - 1.5));
        /** @type {Number[]} */
        const angles = [];
        const l = splits.length;
        let cellSize = cell.squareSize;
        let angleSum = 0;
        for (let i = 0; i < l; i++) {
            splits[i] = Math.sqrt(100 * splits[i]);
            cellSize -= splits[i] * splits[i];
        }
        cellSize = Math.sqrt(cellSize);
        for (let i = 0; i < l; i++) {
            angles.push(angleSum);
            angleSum += splits[i] / (splits[i] + cellSize) / Math.PI / 2;
        }

        const start = Math.random() * 2 * Math.PI;
        for (let i = 0; i < l; i++)
            angles[i] = start + angles[i] * 8 * Math.PI;
        return angles;
    }

    compileStatistics() {
        let internal = 0, external = 0, playing = 0, spectating = 0;
        for (let i = 0, l = this.players.length; i < l; i++) {
            const player = this.players[i];
            if (!player.router.isExternal) { internal++; continue; }
            external++;
            if (player.state === 0) playing++;
            else if (player.state === 1 || player.state === 2)
                spectating++;
        }
        this.stats.limit = this.settings.listenerMaxConnections - this.handle.listener.connections.length + external;
        this.stats.internal = internal;
        this.stats.external = external;
        this.stats.playing = playing;
        this.stats.spectating = spectating;
        this.stats.name = this.settings.serverName;
        this.stats.gamemode = this.handle.gamemode.gamemodeName;
        this.stats.loadTime = this.handle.averageTickTime / this.handle.stepMult;
        this.stats.uptime = Math.floor((Date.now() - this.handle.startTime.getTime()) / 1000);
    }
}

module.exports = World;

const Cell = require("../cells/Cell");
const Player = require("./Player");
const ServerHandle = require("../ServerHandle");