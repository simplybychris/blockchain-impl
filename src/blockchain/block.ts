import config from '../../config';
import Utils from "../app/utils";
import Transaction from "../transaction/transaction";

export default class Block {
    index: number;
    timestamp: number;
    lastHash: string;
    hash: string;
    data: Transaction[];
    nonce: number;
    difficulty: number;

    constructor(index: number, timestamp: number, hash: string, lastHash: string, data: any, nonce: number, difficulty: number) {
        this.index = index;
        this.timestamp = timestamp;
        this.hash = hash;
        this.lastHash = lastHash;
        this.data = data;
        this.nonce = nonce;
        this.difficulty = difficulty || config.DIFFICULTY;
    }

    toString(): string {
        return `
            index     : ${this.index}
            timestamp : ${this.timestamp}
            last hash : ${this.lastHash}
            hash      : ${this.hash}
            data      : ${this.data}
            nonce     : ${this.nonce}
            difficulty: ${this.difficulty}`;
    }

    static generateGenesisBlock(): Block {
        return new this(0, new Date("2021").getTime(), config.BLOCKCHAIN_ADDR, "0", [], 0, config.DIFFICULTY);
    }

    static mineBlock(lastBlock: Block, data?: any): Block {
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
        return "" + Utils.genHash(`${timestamp}${lastHash}${data}${nonce}${difficulty}`);
    }

    static calculateBlockHash(block: Block): string {
        const {timestamp, lastHash, data, nonce, difficulty} = block;
        return Block.calculateHash(timestamp, lastHash, data, nonce, difficulty);
    }

    static adjustDifficulty(lastBlock: Block, currentTimestamp: number): number {
        let difficulty: number = lastBlock.difficulty;
        difficulty = lastBlock.timestamp + config.MINE_RATE > currentTimestamp ? difficulty + 1 : difficulty - 1;
        if (difficulty < config.DIFFICULTY) difficulty = config.DIFFICULTY;
        return difficulty;
    }

}
