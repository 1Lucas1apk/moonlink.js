export class MoonPlayer {
    constructor(infos: any, manager: any, manager_map: any);
    sPayload: any;
    guildId: any;
    textChannel: any;
    voiceChannel: any;
    playing: any;
    connected: any;
    paused: any;
    loop: any;
    volume: any;
    queue: MoonlinkQueue;
    current: any;
    connect(options: any): void;
    disconnect(): void;
    play(): void;
    pause(): void;
    resume(): void;
    setVolume(percent: any): any;
    stop(): boolean;
    destroy(): boolean;
    skip(): void;
    seek(number: any): boolean;
    setLoop(number: any): void;
    removeSong(position: any): boolean;
    skipTo(position: any): boolean;
    #private;
}
import { MoonlinkQueue } from "../@Rest/MoonlinkQueue.js";
