import express, {Express} from 'express';
import Blockchain from '../blockchain';
import P2pServer from '../connection/p2p';
import Wallet from "../wallet";
import TransactionPool from "../transaction/transaction-pool";
import Transaction from "../transaction/transaction";
import Miner from "../miner";
import inquirer from 'inquirer';
import process from 'process';
import Block from "../blockchain/block";
import ChainUtil from "../utils/chain-util";
import config from "../../config";

const ip: any = require('ip');
const HTTP_PORT: any = process.env.HTTP_PORT || 3001;
const P2P_PORT: any = process.env.P2P_PORT || 5001;
const wallet = new Wallet();
const txPool = new TransactionPool();
const bc: Blockchain = new Blockchain();
const p2pServer: P2pServer = new P2pServer(bc, txPool);
const miner = new Miner(bc, txPool, wallet, p2pServer);
const app: Express = express();
const cors = require('cors');

const initHttpServer = (httpPort: number) => {
    app.use(express.urlencoded({extended: true}));
    app.use(express.json());
    const corsOptions = {
        origin: config.FRONT_ADDR
    }

    app.use(cors(corsOptions));


    app.get('/blocks', (req, res) => {
        res.json(bc.chain);
    })

    app.post('/confirmations', (req, res) => {
        const block: Block = req.body;
        res.json(bc.getBlockConfirmationsNumber(block));
    })

    app.post('/mine', (req, res) => {
        const block = bc.addBlock();
        console.log(`New block mined: ${block.toString()}`)
        p2pServer.syncChains();
        res.redirect('/blocks');
    });

    app.get('/mine-transactions', (req, res) => {
        const block = miner.mineTransactions();
        console.log(`New block mined: ${block.toString()}`);
        p2pServer.syncChains();
        res.redirect('/blocks');
    })

    app.get('/transactions', (req, res) => {
        res.json(txPool.transactions);
    })

    app.get('/allTxs', (req, res) => {
        res.json(txPool.transactions.concat(...bc.chain.map((block) => block.data)));
    })

    app.post('/transact', (req, res) => {
        const {recipient, amount} = req.body;
        const transaction: Transaction = wallet.createTransaction(recipient, amount, txPool, bc);
        p2pServer.shareTransaction(transaction);
        res.redirect('/transactions');
    })

    app.post('/balance', (req, res) => {
        const {publicKey} = req.body;
        res.json(ChainUtil.calculateBalance(bc, publicKey));
    })

    app.get('/pubkey', (req, res) => {
        res.json({publicKey: wallet.publicKey});
    })

    app.get('/peers', (req, res) => {
        res.json(new Array(...p2pServer.peersIp));
    })

    app.listen(httpPort, () =>
        console.log('\x1b[33m%s\x1b[0m', `Server listening on port: ${httpPort}\n`)
    );
}

const delay = (ms: number) => {
    const startPoint = new Date().getTime()
    while (new Date().getTime() - startPoint <= ms) {/* wait */
    }
}

initHttpServer(HTTP_PORT);
p2pServer.initServer(P2P_PORT).then(() => {
    displayWelcomePage();
    displayMenu()
});

function displayWelcomePage() {
    console.clear();
    console.log('\x1b[36m%s\x1b[0m', `
 █▀▀ ▀█▀ █ █ █▀▄ █▀▀ █▀█ ▀█▀ █▀▀ █ █ █▀█ ▀█▀ █▀█
 ▀▀█  █  █ █ █ █ █▀▀ █ █  █  █   █▀█ █▀█  █  █ █
 ▀▀▀  ▀  ▀▀▀ ▀▀  ▀▀▀ ▀ ▀  ▀  ▀▀▀ ▀ ▀ ▀ ▀ ▀▀▀ ▀ ▀
`);
    delay(1000);
}

function returnToMenu(no: number) {
    inquirer
        .prompt([
            {
                type: 'confirm',
                name: 'return',
                message: 'Do you want to return?',
            },
        ]).then((answer) => {
        console.clear();
        if (answer.return) {
            displayMenu();
        } else {
            navigateToOption(no);
        }
    });
}

const navigateToOption = async (answer: number) => {
    switch (answer) {
        case 1:
            mine().then(() => {
                displayMenu();
            });
            break;
        case 2:
            console.log("Peers connected to this server:");
            console.log(new Array(...p2pServer.peersIp).join('\n'));
            returnToMenu(2);
            break;
        case 3:
            console.log("public key: ", wallet.publicKey);
            console.log("private key: ", wallet.privateKey, '\n');
            returnToMenu(3);
            break;
        case 4:
            console.log("Your ip address:");
            console.dir(ip.address());
            returnToMenu(4);
            break;
        default:
            console.log("Wrong command. Try again!");
            displayMenu();
            return;
    }
}

let displayMenu = () => {
    console.clear();
    console.log('\x1b[95m%s\x1b[0m', `⚫ P2P: ${P2P_PORT} ⚫ HTTP: ${HTTP_PORT}`);
    inquirer
        .prompt([
            {
                type: 'list',
                name: 'option',
                message: 'Choose action',
                choices: [
                    {
                        'value': 1,
                        'name': 'Mine'
                    },
                    {
                        'value': 2,
                        'name': 'Connected Peers'
                    },
                    {
                        'value': 3,
                        'name': 'Public/Private keys'
                    },
                    {
                        'value': 4,
                        'name': 'Ip address'
                    }
                ],
            },
        ])
        .then(answer => {
            console.clear();
            navigateToOption(<number>answer.option);
        });
}

let mine = async (): Promise<void> => {
    const block = bc.addBlock();
    console.log(`New block mined: ${block.toString()}`)
    // p2pServer.connectToPeers();
    p2pServer.syncChains();
    setTimeout(() => {
        miner.mineTransactions();
    }, 1000);
}
