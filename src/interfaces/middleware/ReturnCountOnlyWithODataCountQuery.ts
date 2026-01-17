/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosRequestConfig } from "axios";

export const ReturnCountOnlyWithCountHeaderDirective = () => (config: AxiosRequestConfig<any>) => {
    const countDirective = config?.headers?.['count'] ?? config?.headers?.['Count'];

    if (countDirective && (countDirective || countDirective?.toLowerCase() === 'true')) {
        const confUrl = config?.url;
        if (confUrl) {
            const url = `${confUrl}/$count`;
            config.url = url;
        }
    }

    return config;
}