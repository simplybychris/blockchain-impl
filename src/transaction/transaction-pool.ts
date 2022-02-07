import Transaction from "./transaction";

export default class TransactionPool {

    transactions: Transaction[];

    constructor() {
        this.transactions = [];
    }

    upsertTx(transaction: Transaction) {
        let transactionById: Transaction | undefined = this.findTxById(transaction.id);

        transactionById ? this.transactions[this.transactions.indexOf(transactionById)] = transaction :
            this.transactions.push(transaction);
    }

    findTxById(txId: string) {
        return this.transactions.find(tx => tx.id === txId);
    }

    findTxByPubKey(publicKey: string) {
        return this.transactions.find(t => t.txInput.address === publicKey);
    }

    getValidTxs() {
        return this.transactions.filter(tx => {
            const totalOutput = tx.txOutputs.reduce((total, output) => {
                return total + output.amount;
            }, 0);

            if (tx.txInput.amount !== totalOutput) {
                console.warn(`Invalid transaction with id: ${tx.id}`);
                return;
            }

            if (!Transaction.verifySig(tx)) {
                console.warn(`Invalid signature for transaction id: ${tx.id}`);
                return;
            }

            return tx;
        });
    }

    clearTransactionPool(): void {
        this.transactions = [];
    }
}
