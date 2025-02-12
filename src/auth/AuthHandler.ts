import { AxiosInstance } from "axios";
import { AxiosRequestConfig } from "axios-ntlm";

/**
 * Auth Handler interface
 */
export interface AuthHandler {
    authenticate(config: AxiosRequestConfig): AxiosInstance;
}