import Block from '../src/blockchain/block';

let data:any, lastBlock:Block , block:Block;

describe('Block', () => {
    beforeEach(() => {
        data = 'test';
        lastBlock = Block.generateGenesisBlock();
        block = Block.mineBlock(lastBlock, data);
    });

    it('sets the `data` to match the input', () => {
        expect(block.data).toEqual(data);
    });

    it('sets the `lastHash` to match the hash of the last block', () => {
        expect(block.lastHash).toEqual(lastBlock.hash);
    });
});