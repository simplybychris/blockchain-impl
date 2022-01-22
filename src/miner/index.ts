import TransactionPool from "../transaction/transaction-pool";
import Blockchain from "../blockchain";
import Wallet from "../wallet";
import P2pServer from "../connection/p2p";
import Transaction from "../transaction/transaction";
import ChainUtil from "../utils/chain-util";

export default class Miner {
    blockchain: Blockchain;
    txPool: TransactionPool;
    minerWallet: Wallet;
    p2pServer: P2pServer;

    constructor(blockchain: Blockchain, txPool: TransactionPool, minerWallet: Wallet, p2pServer: P2pServer) {
        this.blockchain = blockchain;
        this.txPool = txPool;
        this.minerWallet = minerWallet;
        this.p2pServer = p2pServer;
    }

    mineTransactions() {
        const validTransactions: Transaction[] = this.txPool.validTransactions();
        validTransactions.push(
            Transaction.assignRewardTransaction(this.minerWallet, Wallet.blockchainWallet())
        );

        const block = this.blockchain.addBlock(validTransactions);
        this.p2pServer.syncChains();
        this.txPool.clearPool();
        const clearTxMsg = ChainUtil.genHash(ChainUtil.genId());
        this.p2pServer.shareClearTransaction(clearTxMsg);

        return block;
    }
}
