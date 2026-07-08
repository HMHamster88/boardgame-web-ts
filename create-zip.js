import packageInfo from './package.json' with { type: 'json' };
import os from 'node:os';
import AdmZip from 'adm-zip'
import fs from 'node:fs'

fs.mkdirSync('./dist', { recursive: true });

const copyOpts = {
    recursive: true,
    filter: (src, dest) => {
        if (src.includes('games-modules')) {
            return false;
        }
        if (src.endsWith('.sqlite')) {
            return false;
        }
        return true
    }
}

fs.cpSync('./back/dist/bundled', './dist/bundled', copyOpts)

const bundledZip = new AdmZip();
bundledZip.addLocalFolder('./dist/bundled', './')
bundledZip.writeZip(`./dist/bundled-${packageInfo.version}.zip`);

fs.rmSync('./dist/bundled', { recursive: true, force: true });

fs.cpSync('./back/dist/sea', './dist/sea', copyOpts)

const sea = new AdmZip();
bundledZip.addLocalFolder('./dist/sea', './')
const osTypes = {
    'Windows_NT': 'windows',
    'Darwin': 'macos',
    'Linux': 'linux'
}
bundledZip.writeZip(`./dist/sea-${osTypes[os.type()]}-${os.arch()}-${packageInfo.version}.zip`);

fs.rmSync('./dist/sea', { recursive: true, force: true });