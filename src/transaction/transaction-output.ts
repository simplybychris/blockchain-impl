export default class TransactionOutput {
    address: string;
    amount: number;

    constructor(address: string, amount: number) {
        this.address = address;
        this.amount = amount;
    }
}
