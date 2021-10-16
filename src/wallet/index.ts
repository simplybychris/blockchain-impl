import config from '../../config';
import ChainUtil from '../utils/chain-util';
import {ec} from "elliptic";
import KeyPair = ec.KeyPair;

export default class Wallet {
    balance: number;
    keyPair: KeyPair;
    publicKey: any;

    constructor() {
        this.balance = config.INITIAL_BALANCE;
        this.keyPair = ChainUtil.genKeyPair();
        this.publicKey = this.keyPair.getPublic('hex');
        // console.log("New wallet added: \n" +
        //     "Private key: ",this.keyPair.getPrivate('hex'),"\n",
        //     "Public key: ",this.publicKey)
    }

    toString(): string {
        return `Wallet -
            publicKey: ${this.publicKey}
            balance: ${this.balance}`
    }
}