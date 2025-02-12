import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { AuthHandler } from "../AuthHandler.js";
import { AxiosRequestConfig as ThirdPartyAxiosRequestConfig } from "axios-ntlm";

/**
 * Basic Authetication Utility
 */
export class BasicAuthHandler implements AuthHandler { 
    constructor(private username: string, private password: string) { }
    authenticate(config: ThirdPartyAxiosRequestConfig): AxiosInstance {
       config.auth = { username: this.username, password: this.password };
       return axios.create(config as AxiosRequestConfig) as AxiosInstance;
    }
}