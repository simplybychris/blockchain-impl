import {ec} from "elliptic";
import Signature = ec.Signature;

export default class TransactionInput {
    address: string;
    amount: number;
    timestamp: number= 0;
    signature: Signature | string = '';

    constructor(amount: number, address: string) {
        this.amount = amount;
        this.address = address;
    }
}
