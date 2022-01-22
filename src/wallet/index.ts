import config from '../../config';
import ChainUtil from '../utils/chain-util';
import {ec} from "elliptic";
import KeyPair = ec.KeyPair;
import TransactionPool from "../transaction/transaction-pool";
import Transaction from "../transaction/transaction";
import Blockchain from "../blockchain";
import Block from "../blockchain/block";

export default class Wallet {
    balance: number;
    address: string;
    keyPair: KeyPair;
    publicKey: any;
    privateKey: any;

    constructor() {
        this.balance = config.INITIAL_BALANCE;
        this.keyPair = ChainUtil.genKeyPair();
        this.privateKey = this.keyPair.getPrivate('hex');
        this.publicKey = this.keyPair.getPublic('hex');
        this.address = this.privateKey;
    }

    createTransaction(recipient: string, amount: number, transactionPool: TransactionPool, blockchain: Blockchain) {
        this.balance = this.calculateBalance(blockchain);

        if (amount > this.balance && amount >= 1) {
            throw new RangeError(`Amount ${amount} exceeds balance.`);
        }

        let transaction: Transaction | undefined = transactionPool.findTransactionByPubKey(this.publicKey);

        if (transaction) {
            transaction.update(this, recipient, amount);
        } else {
            transaction = Transaction.newTransaction(this, recipient, amount);
            transactionPool.upsertTransaction(transaction);
        }
        return transaction;
    }

    createTransactionFromOtherAddres(recipient: string, amount: number, transactionPool: TransactionPool, blockchain: Blockchain) {
        this.balance = this.calculateBalance(blockchain);

        if (amount > this.balance && amount >= 1) {
            throw new RangeError(`Amount ${amount} exceeds balance.`);
        }

        let transaction: Transaction | undefined = transactionPool.findTransactionByPubKey(this.publicKey);

        if (transaction) {
            transaction.update(this, recipient, amount);
        } else {
            transaction = Transaction.newTransaction(this, recipient, amount);
            transactionPool.upsertTransaction(transaction);
        }
        return transaction;
    }

    calculateBalance(blockchain: Blockchain): number {
        let balance: number = this.balance;
        let txs: Transaction[] = [];
        let startTimestamp: number = 0;
        blockchain.chain.forEach((block:Block) => block.data.forEach((tx: Transaction) => txs.push(tx)));

        const walletInputTxs = txs.filter(tx => tx.txInput.address === this.publicKey);

        if (walletInputTxs.length > 0) {
            const recentInputTx = walletInputTxs.reduce((prev, curr) => prev.txInput.timestamp > curr.txInput.timestamp ? prev : curr);

            balance = <number>recentInputTx.txOutputs.find(output => output.address === this.publicKey)?.amount;
            startTimestamp = recentInputTx.txInput.timestamp;
        }

        txs.forEach(tx => {
            if (tx.txInput.timestamp > startTimestamp) {
                tx.txOutputs.find(output => {
                    if (output.address === this.publicKey) {
                        balance += output.amount;
                    }
                })
            }
        });

        return balance;
    }

    static blockchainWallet() {
        const blockchainWallet = new this();
        blockchainWallet.publicKey = ''+config.BLOCKCHAIN_ADDR;
        blockchainWallet.balance = 0;
        return blockchainWallet;
    }

    toString(): string {
        return `Wallet -
            publicKey: ${this.publicKey}
            balance: ${this.balance}`
    }
}
