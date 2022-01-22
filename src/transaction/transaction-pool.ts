import Transaction from "./transaction";

export default class TransactionPool {

    transactions: Transaction[];

    constructor() {
        this.transactions = [];
    }

    upsertTransaction(transaction: Transaction) {
        let transactionById: Transaction | undefined = this.findTransactionById(transaction.id);

        if (transactionById) {
            this.transactions[this.transactions.indexOf(transactionById)] = transaction;
        } else {
            this.transactions.push(transaction);
        }
    }

    findTransactionById(txId: string) {
        return this.transactions.find(tx => tx.id === txId);
    }

    findTransactionByPubKey(publicKey: string) {
        return this.transactions.find(t => t.txInput.address === publicKey);
    }

    validTransactions() {
        return this.transactions.filter(tx => {
            const totalOutput = tx.txOutputs.reduce((total, output) => {
                return total + output.amount;
            }, 0);

            if(tx.txInput.amount !== totalOutput) {
                console.warn(`Invalid transaction with id: ${tx.id}`);
                return;
            }

            if(!Transaction.verify(tx)){
                console.warn(`Invalid signature for transaction id: ${tx.id}`);
                return;
            }

            return tx;
        });
    }

    clearPool(): void {
        this.transactions = [];
    }
}
