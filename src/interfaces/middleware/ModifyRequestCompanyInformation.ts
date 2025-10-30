/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosRequestConfig } from "axios";

export const modifyRequestCompanyConfig = (environmentConf: { companyName: string | undefined; companyId: string | undefined }) => (config: AxiosRequestConfig<any>) => {
    const company = config?.headers?.['X-Custom-Request-Company'];
    const whichCompanyIdentifier = config?.headers?.['X-Custom-Request-Company-Identifier'];
    config.headers = config.headers ?? {}
    if (company) {
        if (whichCompanyIdentifier) {
            switch (whichCompanyIdentifier) {
                case 'Company-Name': {
                    config.params = config.params ?? {};
                    config.params.company = company;
                    config.headers['X-Custom-Params-Company-Command'] = 'Skip'
                    break;
                };
                case 'Company-Id': {
                    const splittedUrl = config?.url?.split("/");
                    if (splittedUrl && Array.isArray(splittedUrl)) {
                        const last = splittedUrl[splittedUrl.length - 1];
                        const url = `${splittedUrl.slice(0, -1).join("/")}/companies(${company})/${last}`;
                        config.url = url;
                        config.headers = config.headers ?? {}
                        config.headers['X-Custom-Params-Company-Command'] = 'Remove'
                    }
                    break;
                };
                default: {
                    config.headers['X-Custom-Params-Company-Command'] = 'Set'
                }
            }
        }
    } else {
        if (whichCompanyIdentifier) {
            switch (whichCompanyIdentifier) {
                case 'Company-Name': {
                    config.params = config.params ?? {};
                    config.params.company = environmentConf.companyName;
                    config.headers['X-Custom-Params-Company-Command'] = 'Skip'
                    break;
                };
                case 'Company-Id': {
                    const splittedUrl = config?.url?.split("/")
                    if (splittedUrl && Array.isArray(splittedUrl)) {
                        const last = splittedUrl[splittedUrl.length - 1];
                        const url = `${splittedUrl.slice(0, -1).join("/")}/companies(${environmentConf.companyId})/${last}`;
                        config.url = url;
                        config.headers = config.headers ?? {}
                        config.headers['X-Custom-Params-Company-Command'] = 'Remove'
                    }
                    break;
                };
                default: {
                    config.headers['X-Custom-Params-Company-Command'] = 'Set'
                }
            }
        }
    }
    return config;
}