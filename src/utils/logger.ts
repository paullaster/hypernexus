import { pino } from 'pino';
import { LoggingType } from '../transport/types.ts';
export  const logger = pino({level: 'debug'});
export const asyncLogging = async (options: LoggingType, type: string) => {
    return logger.debug(options, type)
}