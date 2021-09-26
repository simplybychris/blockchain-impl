import express, {Express} from 'express';
import Blockchain from '../blockchain';
import P2pServer from '../connection/p2p';

const HTTP_PORT: any = process.env.HTTP_PORT || 3001;
const P2P_PORT: any = process.env.P2P_PORT || 5001;

const bc: Blockchain = new Blockchain();
const p2pServer: P2pServer = new P2pServer(bc);

const initHttpServer = (httpPort: number) => {
    const app: Express = express();
    app.use(express.urlencoded({extended: true}));
    app.use(express.json());

    app.get('/blocks', (req, res) => {
        res.json(bc.chain);
    })

    app.post('/mine', (req, res) => {
        const block = bc.addBlock(req.body.data);
        console.log(`New block mined: ${block.toString()}`)
        p2pServer.syncChains();
        res.redirect('/blocks');
    });

    app.listen(httpPort, () =>
        console.log(`Server listening on port: ${httpPort}`)
    );
}

initHttpServer(HTTP_PORT);
p2pServer.initServer(P2P_PORT);