// for dev purposes only, for production use launcher
import { configDotenv } from 'dotenv';
import { start } from './index.ts'

configDotenv();
process.env['DATA_DIR'] = './dev-data'
process.env['CHECK_FOR_UPDATES'] = 'false'
process.env['PORT'] = '8000'

start('./public')


