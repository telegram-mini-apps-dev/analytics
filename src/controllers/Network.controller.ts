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

    private readonly responseToParams = async (res: Response)=> {
        const response: Response = res.clone();
        if ((String(response.status)[0] === '2') || (response.status === 429)) {
            const data = await response.json();

            this.appModule.setNewArgs(data['Content']);
        }

        return res;
    }

    private readonly generateHeaders = async (compressed: boolean) => {
        const conditionHeaders = {};
        const solution: string | undefined = await this.appModule.solveHumanProofTask();

        if (solution) {
            conditionHeaders["Content"] = solution;
        }

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
            headers: await this.generateHeaders(compressed),
            body: compressed ? await compressData(data) : JSON.stringify(data),
        }).then(this.responseToParams, this.responseToParams);
    }
}
