import { TransportError } from "./TransportError.ts";

export class RateLimitError extends TransportError {
    constructor(message: string, public timeout?: number, public retryAfter?: number) {
        super(message, 429, retryAfter);
        this.name = 'RateLimitError';
    }
}