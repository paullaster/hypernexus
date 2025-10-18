import type { AxiosInstance } from "axios";
import type { AxiosRequestConfig } from "axios-ntlm";

/**
 * Auth Handler interface
 */
export interface AuthHandler {
    authenticate(config: AxiosRequestConfig): AxiosInstance;
}