import Utils from "../app/utils";
import TransactionInput from "./transaction-input";
import TransactionOutput from "./transaction-output";
import Wallet from "../wallet";
import * as ecdsa from "elliptic";
import config from "../../config";

const ec = new ecdsa.ec('secp256k1');

export default class Transaction {
    id: string;
    txInput: TransactionInput = new TransactionInput(0, '0');
    txOutputs: TransactionOutput[];

    constructor() {
        this.id = '';
        this.txOutputs = [];
    }

    static newTransaction(sender: Wallet, recipient: string, amount: number): Transaction {
        if (amount > sender.balance && amount >= 1) console.error(`Amount ${amount} exceeds available balance.`);

        let txOutputs: TransactionOutput [] = [
            {
                amount: sender.balance - amount, address: sender.publicKey
            },
            {
                amount: amount, address: recipient
            }
        ]

        return Transaction.transactionsWithOutput(sender, txOutputs);
    }

    static transactionsWithOutput(sender: Wallet, txOutputs: TransactionOutput[]): Transaction {
        const transaction: Transaction = new this();
        transaction.txOutputs.push(...txOutputs);
        transaction.id = Utils.genHash(transaction);

        Transaction.sign(sender, transaction);
        return transaction;
    }

    static assignRewardTransaction(miner: Wallet, blockchainWallet: Wallet) {
        return Transaction.transactionsWithOutput(blockchainWallet, [
            {amount: config.MINE_REWARD, address: miner.publicKey},
            {amount: 9999999, address: '' + config.BLOCKCHAIN_ADDR},])
    }

    static sign(sender: Wallet, transaction: Transaction): void {
        const key = ec.keyFromPrivate(sender.keyPair.getPrivate('hex').toString());

        transaction.txInput = {
            address: key.getPublic('hex'),
            amount: sender.balance,
            signature: key.sign(Utils.genHash(transaction.txOutputs)),
            timestamp: Date.now()
        };
    }

    static verifySig(transaction: Transaction): boolean {
        return Utils.verifySignature(transaction.txInput.address, Utils.genHash(transaction.txOutputs), transaction.txInput.signature)
    }

    update(senderWallet: Wallet, recipient: string, amount: number): Transaction {
        const senderOutput = <TransactionOutput>this.txOutputs.find(output => output.address === senderWallet.publicKey);

        if (amount > senderOutput.amount) {
            throw new RangeError(`Amount ${amount} exceeds balance.`);
        }

        const recipientOutput = <TransactionOutput>this.txOutputs.find(output => output.address === recipient);
        if (recipientOutput) {
            recipientOutput.amount += amount;
        } else {
            this.txOutputs.push({amount: amount, address: recipient});
        }
        senderOutput.amount -= amount;
        Transaction.sign(senderWallet, this);
        return this;
    }
}
