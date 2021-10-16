import ChainUtil from "../utils/chain-util";
import TransactionInput from "./transaction-input";
import TransactionOutput from "./transaction-output";
import Wallet from "./index";
import * as ecdsa from "elliptic";

const ec = new ecdsa.ec('secp256k1');

export default class Transaction {
    id: string;
    txInput: TransactionInput = new TransactionInput(0, '0');
    txOutputs: TransactionOutput[];

    constructor() {
        this.id = ChainUtil.genId();
        this.txOutputs = [];
    }

    static newTransaction(sender: Wallet, recipient: string, sentAmount: number): Transaction {
        if (sentAmount > sender.balance && sentAmount >= 1) {
            throw new RangeError(`Amount ${sentAmount} exceeds balance.`)
        }

        let txOutputs: TransactionOutput [] = [
            {
                amount: sentAmount, address: recipient
            },
            {
                amount: sender.balance - sentAmount, address: sender.publicKey
            }
        ]

        return Transaction.transactionsWithOutput(sender, txOutputs);
    }

    static transactionsWithOutput(sender: Wallet, txOutputs: TransactionOutput[]): Transaction {
        const transaction: Transaction = new this();
        transaction.txOutputs.push(...txOutputs);

        Transaction.sign(sender, transaction);
        return transaction;
    }

    static sign(sender: Wallet, transaction: Transaction): void {
        const key = ec.keyFromPrivate(sender.keyPair.getPrivate('hex').toString());

        transaction.txInput = {
            address: key.getPublic('hex'),
            amount: sender.balance,
            signature: key.sign(ChainUtil.genHash(transaction.txOutputs)),
            timestamp: Date.now()
        }
    }

    static verify(transaction: Transaction): boolean {
        return ChainUtil.verifySignature(transaction.txInput.address, ChainUtil.genHash(transaction.txOutputs), transaction.txInput.signature)
    }

    update(senderWallet: Wallet, recipient: string, amount: number): Transaction {
        const senderOutput = <TransactionOutput>this.txOutputs.find(output => output.address === senderWallet.publicKey);

        if (amount > senderOutput.amount) {
            throw new RangeError("Amount " + amount + "exceeds balance.");
        }

        senderOutput.amount -= amount;
        this.txOutputs.push({amount: amount, address: recipient});
        Transaction.sign(senderWallet, this);
        return this;
    }

    static getPublicKey(privateKey: string): string {
        return ec.keyFromPrivate(privateKey).getPublic('hex').toString()
    };

    calculateTxHash(): string {
        return ChainUtil.genHash(`${this.id}${this.txInput.address}${this.txInput.amount}${this.txInput.timestamp}${this.txOutputs}`);
    }
}