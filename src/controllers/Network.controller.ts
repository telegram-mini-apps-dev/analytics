import { App } from '../app'
import { BACKEND_URL, STAGING_BACKEND_URL } from '../constants'
import { Errors, throwError } from '../errors'
import { compressData } from '../utils/compress';

export class NetworkController {
    private appModule: App;

    private BACKEND_URL: string = BACKEND_URL;

    constructor(app: App) {
        this.appModule = app;
        if (this.appModule.env === 'STG') {
            this.BACKEND_URL = STAGING_BACKEND_URL;
        }

        if (!this.appModule.getApiToken()) {
            throwError(Errors.TOKEN_IS_NOT_PROVIDED);
        }
    }

    public init() {}

    private async checkAuthError(res: Response): Promise<boolean> {
        if (res.status === 400 || res.status === 403) {
            try {
                const responseText = await res.clone().text();
                const responseData = responseText ? JSON.parse(responseText) : {};
                const errorMessage = responseData.message || responseData.error || responseText || '';
                const errorMessageLower = errorMessage.toLowerCase();
                
                if (errorMessageLower.includes('invalid app_name') || 
                    errorMessageLower.includes('the domain name does not match')) {
                    return true;
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }
        return false;
    }

    private readonly responseToParams = async (res: Response)=> {
        const isAuthError = await this.checkAuthError(res);
        if (isAuthError) {
            this.appModule.clearStorage();
        }
        return res;
    }

    private readonly generateHeaders = (compressed: boolean) => {
        const conditionHeaders = {};

        if (compressed) {
            conditionHeaders['Content-Encoding'] = 'gzip';
        }

        return {
            "TGA-Auth-Token": this.appModule.getApiToken(),
            "Content-Type": "application/json",
            ...conditionHeaders,
        }
    }

    public async recordEvents(
        data: Record<string, any>[],
        compressed: boolean = true,
    ) {
        return await fetch(this.BACKEND_URL + 'events',{
            method: 'POST',
            headers: this.generateHeaders(compressed),
            body: compressed ? await compressData(data) : JSON.stringify(data),
        }).then(this.responseToParams, this.responseToParams);
    }

    public async recordEvent(
        event_name: string,
        data?: Record<string, any>,
        attributes?: Record<string, any>,
        compressed: boolean = true,
    ) {
        if (data?.custom_data) {
            if (!attributes) {
                attributes = data.custom_data;
            } else {
                attributes = Object.assign(data.custom_data, attributes);
            }
        }

        const body = {
            ...data,
            event_name: event_name,
            custom_data: attributes,
            ...this.appModule.assembleEventSession(),
        };

        await fetch(this.BACKEND_URL + 'events',{
            method: 'POST',
            headers: this.generateHeaders(true),
            body: compressed ? await compressData(body) : JSON.stringify(body),
        }).then(this.responseToParams, this.responseToParams);
    }
}
