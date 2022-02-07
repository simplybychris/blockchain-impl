import Block from './block';

export default class Blockchain {
    chain: Block[];

    constructor() {
        this.chain = [Block.generateGenesisBlock()];
    }

    getLatestBlock(): Block {
        return this.chain[this.chain.length - 1];
    }

    getBlockConfirmationsNumber(block: Block): number {
        return this.chain.slice(block.index).length;
    }

    addBlock(data: any[] = []): Block {
        const block = Block.mineBlock(this.getLatestBlock(), data);
        this.chain.push(block);
        return block;
    }

    isChainValid(chain: Block[]): boolean {
        return JSON.stringify(chain[0]) !== JSON.stringify(Block.generateGenesisBlock()) ? false : Blockchain.validateChain(chain);
    }

    private static validateChain(chain: Block[]): boolean {
        let block: Block;
        let lastBlock: Block;
        for (let i = 1; i < chain.length; i++) {
            block = chain[i];
            lastBlock = chain[i - 1];
            if (block.lastHash !== lastBlock.hash ||
                (block.hash !== Block.calculateBlockHash(block))) {
                return false;
            }
        }
        return true;
    }

    updateChain(newChain: Block[]): void {
        if (newChain.length <= this.chain.length) {
            return;
        } else if (!this.isChainValid(newChain)) {
            this.chain = newChain;
        }
    }
}
