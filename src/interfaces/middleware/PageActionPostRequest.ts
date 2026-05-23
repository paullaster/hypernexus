import { AxiosRequestConfig } from "axios";

export const SetPageActionPostRequest = () => (config: AxiosRequestConfig) => {
    const headers = config.headers ?? {};
    const isPageActionPost = headers['Page-Action-Post'] ?? headers['page-action-post'];

    if (isPageActionPost) {

        const identifier = headers['Page-Action-Resource-Identifier'] ?? headers['page-action-resource-identifier'];
        const action = headers['Page-Action'] ?? headers['page-action'];

        if (!identifier || !action) return config;

        const url = config.url;

        if (url) {
            const newUrl = `${url}(${identifier})${action}`;
            config.url = newUrl
         }
    }
    return config;
}