import Block from './block';

export default class Blockchain {

    chain: Block[];

    constructor() {
        this.chain = [Block.generateGenesisBlock()];
    }

    getLatestBlock(): Block {
        return this.chain[this.chain.length - 1];
    }

    addBlock(data: any): Block {
        const block = Block.mineBlock(this.getLatestBlock(), data);
        this.chain.push(block);
        return block;
    }

    isChainValid(chain: Block[]): boolean {
        if (JSON.stringify(chain[0]) !== JSON.stringify(Block.generateGenesisBlock())) return false;
        return this.validateChain(chain);
    }

    private validateChain(chain: Block[]): boolean {
        let block: Block;
        let lastBlock: Block;
        for (let i = 1; i < chain.length; i++) {
            block = chain[i];
            lastBlock = chain[i - 1];
            if (block.lastHash !== lastBlock.hash ||
                block.hash !== Block.calculateBlockHash(block)) {
                return false;
            }
        }
        return true;
    }

    updateChain(newChain: Block[]): void {
        if (newChain.length <= this.chain.length) {
            console.log('Received chain is not longer than the current chain');
            return;
        } else if (!this.isChainValid(newChain)) {
            console.log('The received blockchain is not valid');
        }
        console.log('Replacing blockchain with the new chain');
        this.chain = newChain;
    }
}