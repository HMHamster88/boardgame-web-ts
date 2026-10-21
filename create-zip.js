import packageInfo from './package.json' with { type: 'json' };
import os from 'node:os';
import AdmZip from 'adm-zip'
import fs from 'node:fs'
import path from 'path'

const version = packageInfo.version

const outputDir = path.join('./dist', version)

fs.mkdirSync(outputDir, { recursive: true });

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

// bundle

fs.cpSync('./back/dist/bundled', './dist/bundled', copyOpts)

const bundledZip = new AdmZip();
bundledZip.addLocalFolder('./dist/bundled', './')
bundledZip.writeZip(path.join(outputDir, `${packageInfo.name}-core-module-${version}.zip`))

fs.rmSync('./dist/bundled', { recursive: true, force: true });

// launcher bundle

fs.cpSync('./launcher/dist/bundled', './dist/launcher-bundled', copyOpts)

const launcherBundledZip = new AdmZip();
launcherBundledZip.addLocalFolder('./dist/launcher-bundled', './')
launcherBundledZip.writeZip(path.join(outputDir, `${packageInfo.name}-launcher-bundled-${version}.zip`))

fs.rmSync('./dist/launcher-bundled', { recursive: true, force: true });

// launcher sea

fs.cpSync('./launcher/dist/sea', './dist/sea', copyOpts)

const seaZip = new AdmZip();
seaZip.addLocalFolder('./dist/sea', './')
const osTypes = {
    'Windows_NT': 'windows',
    'Darwin': 'macos',
    'Linux': 'linux'
}
seaZip.writeZip(path.join(outputDir, `${packageInfo.name}-launcher-sea-${osTypes[os.type()]}-${os.arch()}-${packageInfo.version}.zip`))

fs.rmSync('./dist/sea', { recursive: true, force: true });