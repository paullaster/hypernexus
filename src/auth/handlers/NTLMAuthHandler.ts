import { NtlmClient, type NtlmCredentials, type AxiosRequestConfig } from "axios-ntlm";
import type { AxiosInstance } from 'axios';
import { AuthHandler } from "../AuthHandler.js";

/**
 * NTLM AUTHHANDLER
 */
export class NTLMAuthHandler implements AuthHandler {
    constructor(private config: NtlmCredentials) { }
    authenticate(axiosConfig: AxiosRequestConfig): AxiosInstance {
        try {
            const client = NtlmClient(this.config, axiosConfig as AxiosRequestConfig);
            return client as AxiosInstance;
        } catch (error) {
            throw new Error(`NTLM authentication failed: ${error}`);
        }
    }
}