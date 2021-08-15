import Blockchain from "../src/blockchain/index";
import Block from '../src/blockchain/block';

describe('Blockchain', () => {
    let bc: Blockchain, bc2: Blockchain;

    beforeEach(() => {
        bc = new Blockchain();
        bc2 = new Blockchain();
    });

    it('starts with genesis block', () => {
        expect(bc.chain[0]).toEqual(Block.generateGenesisBlock());
    });

    it('adds a new block', () => {
        const data = 'foo';
        bc.addBlock(data);

        expect(bc.chain[bc.chain.length - 1].data).toEqual(data);
    });

    it('validates a valid chain', () => {
        bc2.addBlock('test');

        expect(bc.isValidChain(bc2.chain)).toBe(true);
    });

    it('invalidates a chain with a corrupt genesis block', () => {
        bc2.chain[0].data = 'Bad data';

        expect(bc.isValidChain(bc2.chain)).toBe(false);
    });

    it('invalidates a corrupt chain', () => {
        bc2.addBlock('test');
        bc2.chain[1].data = 'Not test';

        expect(bc.isValidChain(bc2.chain)).toBe(false);
    });

    it('replaces the chain with a valid chain', () => {
        bc2.addBlock('test');

        bc.updateChain(bc2.chain);

        expect(bc.chain).toEqual(bc2.chain);
    });

    it('does not replace the chain with one of less than or equal to length', () => {
        bc.addBlock('test');

        bc.updateChain(bc2.chain);

        expect(bc.chain).not.toEqual(bc2.chain);
    });

});