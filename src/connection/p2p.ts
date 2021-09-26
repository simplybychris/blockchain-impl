import WebSocket from 'ws';
import Blockchain from '../blockchain';
import {peers} from './p2p_config';

export default class P2pServer {
    constructor(blockchain: Blockchain) {
        this.blockchain = blockchain;
        this.sockets = [];
    }

    blockchain: Blockchain;
    sockets: WebSocket[];

    initServer(p2pPort: number): void {
        const server = new WebSocket.Server({
            port: p2pPort
        });
        server.on('connection', socket => {
            this.connectSocket(socket);
        })
        this.connectToPeers();
        console.log(`Listening for p2p connections on port: ${p2pPort}`);
    }

    connectSocket(socket: WebSocket): void {
        this.sockets.push(socket);
        console.log('Socket connected');
        this.messageHandler(socket);
        socket.send(JSON.stringify(this.blockchain.chain));
    }

    connectToPeers(): void {
        peers.forEach(peer => {
            const socket = new WebSocket(peer);
            socket.on('open', () => {
                this.connectSocket(socket);
            })
        });
    }

    messageHandler(socket: WebSocket): void {
        socket.on('message', msg => {
            const data = JSON.parse(msg.toString());
            this.blockchain.updateChain(data);
        })
    }

    sendChain(socket: WebSocket): void {
        socket.send(JSON.stringify(this.blockchain.chain));
    }

    syncChains(): void {
        this.sockets.forEach(socket => {
            this.sendChain(socket);
        });
    }
}