/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosRequestConfig } from "axios";
import { TransportError } from "../../errors/TransportError.js";

export const setRuntimeCompanyConfigHeaders = (environmentConf: { companyName: string | undefined; companyId: string | undefined; companyUse: string; }) => (config: AxiosRequestConfig<any>) => {

    const { companyId, companyName, companyUse } = environmentConf;
    // Throw when preferred company identifier is not provided
    if (!companyUse) throw new TransportError('Company pereferred identifier must be specified', 400, companyUse);

    // Set environment prefferred BC company identifier
    switch (companyUse) {
        case 'Company-Id': {

            if (!config) config = {};
            if (!config.headers) config.headers = {};
            config.headers['X-Custom-Request-Company'] = companyId;
            config.headers['X-Custom-Request-Company-Identifier'] = 'Company-Id';
            break;
        };
        case 'Url-Complete': {

            if (!config) config = {};
            if (!config.headers) config.headers = {};
            config.headers['X-Custom-Params-Company-Command'] = 'Remove';
            break;
        }

        case 'Company-Name': {

            if (!config) config = {};
            if (!config.params) config.params = {};
            config.params['company'] = companyName;
            break;
        }
    }
    return config;
}