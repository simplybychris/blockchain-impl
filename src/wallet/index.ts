import config from '../../config';
import Utils from '../app/utils';
import {ec} from "elliptic";
import KeyPair = ec.KeyPair;
import TransactionPool from "../transaction/transaction-pool";
import Transaction from "../transaction/transaction";
import Blockchain from "../blockchain";

export default class Wallet {
    address: string;
    balance: number;
    keyPair: KeyPair;
    publicKey: any;
    privateKey: any;

    constructor() {
        this.balance = config.INITIAL_BALANCE;
        this.keyPair = Utils.genKeyPair();
        this.privateKey = this.keyPair.getPrivate('hex');
        this.publicKey = this.keyPair.getPublic('hex');
        this.address = this.privateKey;
    }

    createTransaction(recipient: string, amount: number, transactionPool: TransactionPool, blockchain: Blockchain) {
        this.balance = Utils.calculateBalance(blockchain, this.publicKey);

        if (amount > this.balance && amount >= 1) console.error(`Amount ${amount} exceeds balance.`);

        let transaction: Transaction | undefined = transactionPool.findTxByPubKey(this.publicKey);

        transaction ? transaction.update(this, recipient, amount) :
            transactionPool.upsertTx(Transaction.newTransaction(this, recipient, amount));

        return transaction;
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
