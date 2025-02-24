import { TransportError } from "./TransportError.js";

export class TimeoutError extends TransportError {
    constructor(message: string, public timeout?: number, public data?: any) {
        super(message, timeout, data);
        this.name = 'TimeoutError';
    }
}