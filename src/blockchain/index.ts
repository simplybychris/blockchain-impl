import { threadId } from 'worker_threads';
import Block from './block';

export default class Blockchain {

    chain: Block[];

    constructor() {
        this.chain = [Block.generateGenesisBlock()];
    }

    getLatestBlock(){
        return this.chain[this.chain.length - 1];
    }

    addBlock(data: any) {
        const block = Block.mineBlock(this.getLatestBlock(), data);
        this.chain.push(block);

        return block;
    }

    isValidChain(chain: Block[]) {
        if (JSON.stringify(chain[0]) !== JSON.stringify(Block.generateGenesisBlock())) return false;

        for (let i = 1; i < chain.length; i++) {
            const block = chain[i];
            const lastBlock = chain[i - 1];

            if (block.lastHash !== lastBlock.hash ||
                block.hash !== block.calculateHash()) {
                return false;
            }
        }
        return true;
    }

    updateChain(newChain: Block[]) {
        if (newChain.length <= this.chain.length) {
            console.log('Received chain is not longer than the current chain');
            return;
        } else if (!this.isValidChain(newChain)) {
            console.log('The received chain is not valid');
        }

        console.log('Replacing blockchain width the new chain');
        this.chain = newChain;
    }
}