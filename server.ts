import * as express from 'express';
import { RankingController } from './controllers';

const app: express.Application = express();
const port = process.env.PORT || 2345;

app.use('/', RankingController);

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}/`);
}).setTimeout(10000);