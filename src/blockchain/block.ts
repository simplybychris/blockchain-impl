import SHA256 from "crypto-js/sha256";
import config from '../../config';
import ChainUtil from "../utils/chain-util";

export default class Block {

    constructor(index: number, timestamp: number, hash: string, lastHash: string, data: any, nonce: number, difficulty: number) {
        this.index = index;
        this.timestamp = timestamp;
        this.hash = hash;
        this.lastHash = lastHash;
        this.data = data;
        this.nonce = nonce;
        this.difficulty = difficulty || config.DIFFICULTY;
    }

    index: number;
    timestamp: number;
    lastHash: string;
    hash: string;
    data: any;
    nonce: number;
    difficulty: number;

    toString(): string {
        return `
            index     : ${this.index}
            timestamp : ${this.timestamp}
            last hash : ${this.lastHash.substring(0, 10)}
            hash      : ${this.hash.substring(0, 10)}
            data      : ${this.data}
            nonce     : ${this.nonce}
            difficulty: ${this.difficulty}`;
    }

    static generateGenesisBlock(): Block {
        return new this(0, new Date("2021").getTime(), '0', "0", 0, 0, config.DIFFICULTY);
    }

    static mineBlock(lastBlock: Block, data: any): Block {
        let hash: string;
        let timestamp: number;
        let nonce: number = 0;
        let difficulty: number = lastBlock.difficulty;

        do {
            nonce++
            timestamp = Date.now();
            difficulty = Block.adjustDifficulty(lastBlock, timestamp);
            hash = Block.calculateHash(timestamp, lastBlock.lastHash, data, nonce, difficulty);
        } while (hash.substr(0, difficulty) !== '0'.repeat(difficulty))

        return new this(lastBlock.index + 1, timestamp, hash, lastBlock.hash, data, nonce, difficulty);
    }

    static calculateHash(timestamp: number, lastHash: string, data: any, nonce: number, difficulty: number): string {
        return "" + ChainUtil.genHash(`${timestamp}${lastHash}${data}${nonce}${difficulty}`);
    }

    static calculateBlockHash(block: Block): string {
        const {timestamp, lastHash, data, nonce, difficulty} = block;
        return Block.calculateHash(timestamp, lastHash, data, nonce, difficulty);
    }

    static adjustDifficulty(lastBlock: Block, currentTimestamp: number): number {
        let difficulty: number = lastBlock.difficulty;
        difficulty = lastBlock.timestamp + config.MINE_RATE > currentTimestamp ? difficulty + 1 : difficulty - 1;
        if (difficulty < 1) difficulty = 1;
        return difficulty;
    }

}