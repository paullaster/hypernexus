import { TransportError } from "./TransportError.js";

export class TimeoutError extends TransportError {
    constructor(message: string, public timeout?: number) {
        super(message, 408);
        this.name = 'TimeoutError';
    }
}