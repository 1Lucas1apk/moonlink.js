"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Manager = void 0;
const node_events_1 = require("node:events");
const index_1 = require("../../index");
class Manager extends node_events_1.EventEmitter {
    initialize = false;
    options;
    sendPayload;
    nodes;
    players = new (index_1.Structure.get("PlayerManager"))(this);
    version = require("../../index").version;
    database;
    constructor(config) {
        super();
        this.sendPayload = config?.sendPayload;
        this.options = {
            clientName: `Moonlink.js/${this.version} (https://github.com/Ecliptia/moonlink.js)`,
            defaultPlatformSearch: "youtube",
            NodeLinkFeatures: false,
            previousInArray: false,
            logFile: { path: undefined, log: false },
            movePlayersOnReconnect: false,
            resume: false,
            autoResume: false,
            ...config.options,
        };
        this.nodes = new (index_1.Structure.get("NodeManager"))(this, config.nodes);
        if (this.options.plugins) {
            this.options.plugins.forEach(plugin => {
                plugin.load(this);
            });
        }
    }
    init(clientId) {
        if (this.initialize)
            return;
        if (this.options.logFile?.log) {
            (0, index_1.validateProperty)(this.options.logFile?.path, value => value !== undefined || typeof value !== "string", "Moonlink.js > Options > A path to save the log was not provided");
            this.on("debug", (message) => (0, index_1.Log)(message, this.options.logFile?.path));
        }
        index_1.Structure.manager = this;
        this.options.clientId = clientId;
        this.database = new (index_1.Structure.get("Database"))(this);
        this.nodes.init();
        this.initialize = true;
        this.emit("debug", "Moonlink.js > initialized with clientId(" + clientId + ")");
    }
    async search(options) {
        return new Promise(async (resolve) => {
            (0, index_1.validateProperty)(options, value => value !== undefined, "(Moonlink.js) - Manager > Search > Options is required");
            (0, index_1.validateProperty)(options.query, value => value !== undefined || value !== "string", "(Moonlink.js) - Manager > Search > Query is required");
            let query = options.query;
            let source = options.source || this.options.defaultPlatformSearch;
            let requester = options.requester || null;
            if (![...this.nodes.cache.values()].filter(node => node.connected))
                throw new Error("No available nodes to search from.");
            let node = this.nodes.cache.has(options?.node)
                ? this.nodes.get(options?.node)
                : this.nodes.best;
            let req = await node.rest.loadTracks(source, query);
            return resolve(new (index_1.Structure.get("SearchResult"))(req, options));
        });
    }
    async packetUpdate(packet) {
        if (!["VOICE_STATE_UPDATE", "VOICE_SERVER_UPDATE"].includes(packet.t))
            return;
        if (!packet.d.token && !packet.d.session_id)
            return;
        const player = this.getPlayer(packet.d.guild_id);
        if (!player)
            return;
        if (!player.voiceState)
            player.voiceState = {};
        if (packet.t === "VOICE_SERVER_UPDATE") {
            player.voiceState.token = packet.d.token;
            player.voiceState.endpoint = packet.d.endpoint;
            this.emit("debug", `Moonlink.js > Received voice server update for guild ${player.guildId}`);
            await this.attemptConnection(player.guildId);
        }
        else if (packet.t === "VOICE_STATE_UPDATE") {
            if (packet.d.user_id !== this.options.clientId)
                return;
            if (!packet.d.channel_id) {
                player.connected = false;
                player.playing = false;
                player.voiceChannelId = null;
                player.voiceState = {};
                this.emit("playerDisconnected", player);
                return;
            }
            if (packet.d.channel_id !== player.voiceChannelId) {
                this.emit("playerMoved", player, player.voiceChannelId, packet.d.channel_id);
                player.voiceChannelId = packet.d.channel_id;
            }
            player.voiceState.sessionId = packet.d.session_id;
            this.emit("debug", `Moonlink.js > Received voice state update for guild ${player.guildId}`);
            await this.attemptConnection(player.guildId);
        }
    }
    async attemptConnection(guildId) {
        const player = this.getPlayer(guildId);
        if (!player)
            return;
        const voiceState = player.voiceState;
        if (!voiceState.token || !voiceState.sessionId || !voiceState.endpoint) {
            this.emit("debug", `Moonlink.js > Missing voice server data for guild ${guildId}, wait...`);
            return false;
        }
        let attempts = await player.node.rest.update({
            guildId,
            data: {
                voice: {
                    sessionId: voiceState.sessionId,
                    token: voiceState.token,
                    endpoint: voiceState.endpoint,
                },
            },
        });
        this.emit("debug", `Moonlink.js > Attempting to connect to ${player.node.identifier ?? player.node.host} for guild ${guildId}`);
        if (attempts)
            player.voiceState.attempt = true;
        return true;
    }
    createPlayer(config) {
        return this.players.create(config);
    }
    getPlayer(guildId) {
        return this.players.get(guildId);
    }
    hasPlayer(guildId) {
        return this.players.has(guildId);
    }
    deletePlayer(guildId) {
        this.players.delete(guildId);
        return true;
    }
    getAllPlayers() {
        return this.players.cache;
    }
}
exports.Manager = Manager;
//# sourceMappingURL=Manager.js.map