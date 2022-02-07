import express, {Express} from 'express';
import Blockchain from '../blockchain';
import P2pServer from '../connection/p2p';
import Wallet from "../wallet";
import TransactionPool from "../transaction/transaction-pool";
import Transaction from "../transaction/transaction";
import Miner from "../transaction/miner";
import inquirer from 'inquirer';
import process from 'process';
import config from "../../config";

const ip: any = require('ip');
const HTTP_PORT: any = process.env.HTTP_PORT || 4001;
const P2P_PORT: any = process.env.P2P_PORT || 5001;
const wallet = new Wallet();
const txPool = new TransactionPool();
const bc: Blockchain = new Blockchain();
const p2pServer: P2pServer = new P2pServer(bc, txPool);
const miner = new Miner(bc, txPool, wallet, p2pServer);
const app: Express = express();
const cors = require('cors');
const routes = require('./routes')(bc, p2pServer, txPool, wallet, miner);

const initHttpServer = (httpPort: number) => {
    app.use(express.urlencoded({extended: true}));
    app.use(express.json());
    const corsOptions = {
        origin: config.FRONT_ADDR
    }

    app.use(cors(corsOptions));

    app.use('/', routes);

    app.listen(httpPort, () =>
        console.log('\x1b[33m%s\x1b[0m', `Server listening on port: ${httpPort}\n`)
    );
}

const delay = (ms: number) => {
    const startPoint = new Date().getTime()
    while (new Date().getTime() - startPoint <= ms);
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
    p2pServer.syncChains();
    setTimeout(() => {
        miner.mineTransactions();
    }, 1000);
}
