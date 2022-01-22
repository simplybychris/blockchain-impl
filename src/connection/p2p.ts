import WebSocket from 'ws';
import Blockchain from '../blockchain';
import {peers} from './p2p_config';
import TransactionPool from "../transaction/transaction-pool";
import Transaction from "../transaction/transaction";
import {MessageType} from "./message";
import ChainUtil from "../utils/chain-util";
import {IncomingMessage} from "http";
import config from "../../config";

export default class P2pServer {
    server: WebSocket.Server | undefined;
    blockchain: Blockchain;
    txPool: TransactionPool;
    sockets: WebSocket[];
    peersIp: Set<string>;
    receivedMsg: string[] = [];

    constructor(blockchain: Blockchain, txPool: TransactionPool) {
        this.blockchain = blockchain;
        this.txPool = txPool;
        this.sockets = [];
        this.peersIp = new Set<string>();
        this.receivedMsg = [];
    }

    async initServer(p2pPort: number) {
        this.server = new WebSocket.Server({
            port: p2pPort
        });

        this.server.on('connection', (socket, req) => {

            this.managePeer(req, socket);
            this.connectSocket(socket);
        })
        this.connectToPeers();
        console.log('\x1b[33m%s\x1b[0m', `Listening for p2p connections on port: ${p2pPort}`);
        console.log(this.server.address());

    }

    private managePeer(req: IncomingMessage, socket: WebSocket) {
        let ip:string = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress as string;
        if (ip) {
            ip = ip.toString().replace('::ffff:', '');
            if (this.peersIp)
                this.peersIp.add(ip);

            socket.on('close', () => {
                    this.peersIp.delete(ip);
            })
        }
    }

    connectSocket(socket: WebSocket): void {
        if(this.sockets.length === config.MAX_PEERS) return;
        this.sockets.push(socket);
        this.messageHandler(socket);
        this.sendChain(socket);
    }

    connectToPeers(): void {
        peers.forEach(peer => {
            if(this.sockets.length === config.MAX_PEERS) return;
            const socket = new WebSocket(peer);
            socket.on('error', () => console.error("\nError connecting to :", peer));
            socket.on('open', () => {
                this.connectSocket(socket);
                const ip = socket.url.replace('ws://', '');
                this.peersIp.add(ip);
                socket.on('close', () => {
                    this.peersIp.delete(ip);
                    this.sockets = this.sockets.filter(ws => ws !== socket);
                })
            })

        });
    }

    messageHandler(socket: WebSocket): void {
        socket.on('message', msg => {
            const data = JSON.parse(msg.toString());
            if (this.receivedMsg && !this.receivedMsg.find(msg => data.msgHash === msg)) {
                switch (data.type) {
                    case MessageType.chain:
                        this.blockchain.updateChain(data.chain);
                        this.syncChains();
                        break;
                    case MessageType.transaction:
                        this.txPool.upsertTransaction(data.transaction);
                        break;
                    case MessageType.clear_tx:
                        this.txPool.clearPool();
                        this.shareClearTransaction(data.msgHash);
                        break;
                }
            }
        });
    }

    sendChain(socket: WebSocket, currentMsgHash?: string): void {
        socket.send(JSON.stringify({
            type: MessageType.chain,
            chain: this.blockchain.chain,
            msgHash: currentMsgHash
        }));
    }

    syncChains(): void {
        const currentMsgHash: string = ChainUtil.genHash(this.blockchain.chain);
        this.receivedMsg.push(currentMsgHash);
        this.sockets.forEach(socket => {
            this.sendChain(socket, currentMsgHash);
        });
    }

    shareTransaction(transaction: Transaction) {
        this.sockets.forEach(socket => this.sendTransaction(socket, transaction))
    }

    shareClearTransaction(currentMsgHash: string) {
        this.receivedMsg.push(currentMsgHash);
        this.txPool.clearPool();
        this.sockets.forEach(socket => socket.send(JSON.stringify(
            {
                type: MessageType.clear_tx,
                msgHash: currentMsgHash
            }
        )));
    }

    private sendTransaction(socket: WebSocket, transaction: Transaction) {
        const currentMsgHash: string = ChainUtil.genHash(transaction);
        this.receivedMsg.push(currentMsgHash);
        socket.send(JSON.stringify({
            type: MessageType.transaction,
            msgHash: ChainUtil.genHash(transaction),
            transaction
        }));
    }
}
