import { TransportError } from "./TransportError.ts";

export class RateLimitError extends TransportError {
    constructor(message: string, public retryAfter?: number) {
        super(message, 429);
        this.name = 'RateLimitError';
    }
}