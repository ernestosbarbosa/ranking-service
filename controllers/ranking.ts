import { Router, Request, Response } from 'express';
import * as queue from 'express-queue'
import * as timeout from 'express-timeout-handler'
import * as cors from 'cors'
import * as bodyParser from 'body-parser'
import * as loki from 'lokijs'
import { v4 as uuidv4 } from 'uuid'
import { check, validationResult } from 'express-validator'

const router: Router = Router();
const db = new loki('db.json');
const rankingTable = db.addCollection('ranking');

const options = {
    timeout: 300000,

    onTimeout: function (req: Request, res: Response) {
        res.status(503).send('Service unavailable. Please retry.');
    }
};

router.use(cors());
// router.use(bodyParser.json());
router.use(bodyParser.json({ limit: '50mb' }));
router.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
router.use(queue({ activeLimit: 1, queuedLimit: -1 }));
router.use(timeout.handler(options));

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