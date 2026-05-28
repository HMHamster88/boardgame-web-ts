import express from 'express';
import { configDotenv } from 'dotenv';
import history from 'connect-history-api-fallback';
import { startWs } from './backWs';
import os from 'os';

configDotenv();

const app = express();
const port = process.env.PORT ?? 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const staticMw = express.static('./public');

app.use(staticMw);

app.use(
    history({
        verbose: true,
        index: '/index.html'
    })
);

app.use(staticMw);

const server = app.listen(port, () => {
    console.log(`Static server is running on port ${port}`);
});

startWs(server)

Object.values(os.networkInterfaces()).forEach(interfaces => {
    interfaces?.forEach(int => {
        console.log(`http://${int.address}:${port}`)
    })
});



