import { Router, Request, Response, NextFunction } from 'express';
import * as queue from 'express-queue'
import * as timeout from 'express-timeout-handler'
import * as cors from 'cors'
import * as bodyParser from 'body-parser'
import * as loki from 'lokijs'
import { v4 as uuidv4 } from 'uuid'
import { check, validationResult } from 'express-validator'
import * as rateLimit from 'express-rate-limit'
import * as delay from 'randelay'

const router: Router = Router();
const db = new loki('db.json');
const rankingTable = db.addCollection('ranking');

const MAX_CONNECTIONS = 50;
const TIMEOUT = 15000;
const options = {
    timeout: TIMEOUT,

    onTimeout: function (req: Request, res: Response) {
        res.status(503).send('Service unavailable. Please retry.');
    }
};

router.use(cors());
router.use(bodyParser.json({ limit: '50mb' }));
router.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
router.use(queue({ activeLimit: 1, queuedLimit: -1 }));
router.use(timeout.handler(options));
router.use(rateLimit(
    {
        max: MAX_CONNECTIONS,
        windowMs: 1000,
        message: "Max connections",
        onLimitReached: function (req, res, options) {
            //console.log(req.rateLimit)
        }
    }
))
router.use((req: Request, res: Response, next: NextFunction) => {
    delay(100, '17s').then(() => {
        next();
    })
});

router.get('/', (req: Request, res: Response) => {
    return res.status(501).send();
});

router.get('/:idJogo', (req: Request, res: Response) => {
    let ranking = rankingTable.find({ idJogo: parseInt(req.params.idJogo) });
    if (!ranking) {
        return res.status(404).send();
    }
    return res.status(200).send(ranking);
});

router.get('/:idJogo/:guid', (req: Request, res: Response) => {
    let ranking = rankingTable.findOne({ guid: req.params.guid });
    if (!ranking) {
        return res.status(404).send();
    }
    return res.status(200).send(ranking);
});

router.post('/',[
    check('idJogo').isNumeric(),
    check('nomeJogador').isAlpha(),
    check('palavra').isAlpha(),
    check('tentativas').isNumeric(),
    check('timestamp').isNumeric()
], (req: Request, res: Response) => {
    if((Math.random() * 10) < 3){
        return res.status(200).send({
            erro: {
                mensagem: "Database sync failed",
                code: "AAFF0099"
            }
        });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }    
    if (rankingTable.find({ guid: req.body.guid }).length > 0) {
        return res.status(409).send();
    }
    let body = req.body
    body.guid = uuidv4();
    rankingTable.insert(req.body);
    return res.status(201).send(body.guid);
});

export const RankingController: Router = router;