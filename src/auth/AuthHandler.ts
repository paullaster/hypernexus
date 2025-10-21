import type { AxiosInstance } from "axios";
import type { AxiosRequestConfig } from "axios-ntlm";

/**
 * Auth Handler interface
 */
export interface AuthHandler {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [x: string]: any;
    authenticate(config: AxiosRequestConfig): AxiosInstance;
}