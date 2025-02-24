import { pino } from 'pino';

const d = new Date();
const destination = process.env.APP_LOG_CHANNEL === 'daily' ? `./log-${d.getFullYear()}-0${d.getMonth()+1}-${d.getDate() < 10 ? '0'+d.getDate() : d.getDate()}`: './logfile'
const transport = pino.transport({
    target: '/storage/logs/pino',
    options: {
        destination
    }
})
export  const logger = pino({level: process.env.APP_LOG_LEVEL ?? 'debug'});