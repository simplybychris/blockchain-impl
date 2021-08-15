const SHA256 = require("crypto-js/sha256");

export default class Block {

    constructor(index:number, timestamp: string, lastHash: string, data: any) {
        this.index = index;
        this.timestamp = timestamp;
        this.lastHash = lastHash;
        this.data = data;
        this.hash = this.calculateHash();
    }
    
    index: number;
    timestamp: string;
    lastHash: string;
    hash: string;
    data: any;

    toString() {
        return `
            index    : ${this.index}
            timestamp: ${this.timestamp}
            last hash: ${this.lastHash.substring(0, 10)}
            hash     : ${this.hash.substring(0, 10)}
            data     : ${this.data}`;
    }

    static generateGenesisBlock() {
        return new this(0, '2021-8-14', '0', "First block");
    }

    static mineBlock(lastBlock: Block, data: any) {
        const timestamp =  new Date(Date.now()).toISOString().split('T')[0]
        const lastHash = lastBlock.hash;

        return new this(lastBlock.index+1,timestamp, lastHash, data);
    }

    calculateHash(){
        return SHA256(`${this.index}${this.timestamp}${this.lastHash}${this.data}`).toString();
    }

}