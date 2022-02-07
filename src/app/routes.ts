import Block from "../blockchain/block";
import Transaction from "../transaction/transaction";
import Utils from "./utils";
import P2pServer from "../connection/p2p";
import Blockchain from "../blockchain";
import TransactionPool from "../transaction/transaction-pool";
import Wallet from "../wallet";
import Miner from "../transaction/miner";

const express = require('express');

module.exports = function (bc: Blockchain, p2pServer: P2pServer, txPool: TransactionPool, wallet: Wallet, miner: Miner) {

    const router = express.Router();

    router.get('/blocks', (req: any, res: any) => {
        res.json(bc.chain);
    })

    router.post('/confirmations', (req: any, res: any) => {
        const block: Block = req.body;
        res.json(bc.getBlockConfirmationsNumber(block));
    })

    router.post('/mine', (req: any, res: any) => {
        const block = bc.addBlock();
        console.log(`New block mined: ${block.toString()}`)
        p2pServer.syncChains();
        res.redirect('/blocks');
    });

    router.get('/mine-transactions', (req: any, res: any) => {
        const block = miner.mineTransactions();
        console.log(`New block mined: ${block.toString()}`);
        p2pServer.syncChains();
        res.redirect('/blocks');
    })

    router.get('/transactions', (req: any, res: any) => {
        res.json(txPool.transactions);
    })

    router.get('/allTxs', (req: any, res: any) => {
        res.json(txPool.transactions.concat(...bc.chain.map((block) => block.data)));
    })

    router.post('/transact', (req: any, res: any) => {
        const {recipient, amount} = req.body;
        const transaction: Transaction | undefined = wallet.createTransaction(recipient, amount, txPool, bc);
        p2pServer.shareTransaction(transaction);
        res.redirect('/transactions');
    })

    router.post('/balance', (req: any, res: any) => {
        const {publicKey} = req.body;
        res.json(Utils.calculateBalance(bc, publicKey));
    })

    router.get('/pubkey', (req: any, res: any) => {
        res.json({publicKey: wallet.publicKey});
    })

    router.get('/peers', (req: any, res: any) => {
        res.json(new Array(...p2pServer.peersIp));
    })

    return router;
}

