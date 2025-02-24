import { pino } from 'pino';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdir, stat } from 'fs/promises';
import dotenv from "dotenv";
/**
 * Load environment variables
 */
dotenv.config();


// _dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(dirname(dirname(__filename)));


const getLogfileName = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');;
    const day = String(d.getDate()).padStart(2, '0');

    return process.env.APP_LOG_CHANNEL === 'daily'
        ? `log-${year}-${month}-${day}.log`
        : 'logfile.log';
    
}

// Configre the transport
const logDir = join(__dirname, 'storage', 'logs');
const destination = join(logDir, getLogfileName());

// ensure log directory exist
const ensureLogdir = async (dir: string) => {
    try { 
        // Check directory exists
        await stat(dir); 
    } catch (err: unknown) { 
        if (err.code === 'ENOENT') { 
            // Create directory
            await mkdir(dir, { recursive: true });
        } else {
            throw err;
        }
    }
}

await ensureLogdir(logDir);

// Base logger configuration
const baseLogger = pino({
    level: process.env.LOG_LEVEL || 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
}, pino.destination({
    dest: destination,
    sync: false,
}));


export const logger = baseLogger;

