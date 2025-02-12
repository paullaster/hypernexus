export class TransportError extends Error { 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(message: string, public statusCode?: number, public data?: any) {
        super(message);
        this.name = 'TransportError';
    }
}