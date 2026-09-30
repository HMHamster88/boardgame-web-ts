import express from 'express';
import { configDotenv } from 'dotenv';
import history from 'connect-history-api-fallback';
import { startWs } from './backWs.ts';
import os from 'os';
import { startCli } from './cli.ts';
import packageInfo from '../../package.json' with { type: 'json' };
import { homedir } from 'node:os';
import path from 'node:path';
import fs from 'node:fs'

configDotenv();

const dataDir = process.env.DATA_DIR ||  path.join(homedir(), 'boardgame-web-ts')

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir)
}

const app = express();
const port = process.env.PORT ?? 8000;

console.log('Starting boardgames engine...')
console.log(`Version ${packageInfo.version}`)

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

app.use('/games-modules', express.static(path.join(dataDir, 'games-modules')))

const server = app.listen(port);

await startWs(server, dataDir);

Object.values(os.networkInterfaces()).forEach((interfaces) => {
    interfaces?.forEach((int) => {
        console.log(`http://${int.address}:${port}`);
    });
});

startCli()


