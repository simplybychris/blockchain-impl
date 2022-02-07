import {SHA256} from "crypto-js";
import {ec as EC} from 'elliptic';
import {v4 as uuidv4} from 'uuid';
const ec = new EC('secp256k1');
import KeyPair = EC.KeyPair;
import Signature = EC.Signature;
import Blockchain from "../blockchain";
import Transaction from "../transaction/transaction";
import config from "../../config";

export default class Utils {

    static genHash(data: any): string {
        return SHA256(JSON.stringify(data)).toString();
    }

    static genKeyPair(): KeyPair {
        return ec.genKeyPair();
    }

    static genId() {
        return uuidv4();
    }

    static getKeyFromPublic(publicKey: string) {
        return ec.keyFromPublic(publicKey);
    }

    static verifySignature(publicKey: string, dataHash: any, signature: Signature | string): boolean {
        return ec.keyFromPublic(publicKey, 'hex').verify(dataHash, signature);
    }

    static calculateBalance(blockchain: Blockchain, publicKey: string): number {
        let balance: number = config.INITIAL_BALANCE || 0;

        let txs: Transaction[];
        let startTimestamp: number = 0;

        txs = blockchain.chain.flatMap(block => block.data.flat());

        const walletInputTxs = txs.filter(tx => tx.txInput.address === publicKey);

        if (walletInputTxs.length > 0) {
            const recentInputTx = walletInputTxs.reduce((prev, curr) => prev.txInput.timestamp > curr.txInput.timestamp ? prev : curr);

            balance = <number>recentInputTx.txOutputs.find(output => output.address === publicKey)?.amount;
            startTimestamp = recentInputTx.txInput.timestamp;
        }

        txs.forEach(tx => {
            if (tx.txInput.timestamp > startTimestamp) {
                tx.txOutputs.find(output => {
                    if (output.address === publicKey) {
                        balance += output.amount;
                    }
                })
            }
        });

        return balance;
    }
}
