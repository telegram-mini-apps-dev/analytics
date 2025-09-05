import {App} from "../app";
import {BACKEND_URL} from "../constants";

export class HumanProofService {
    private worker: Worker;

    constructor(private readonly appModule: App) {}

    async init() {
        const workerScript = await fetch(BACKEND_URL + 'c3e068ebf11840ed3fc311a6f2df80b20fa05d25', {
            signal: AbortSignal.timeout(3000)
        }).catch(err => {
            throw err;
        });

        if (workerScript instanceof Response) {
            this.worker = new Worker(URL.createObjectURL(await workerScript.blob()));

            this.worker.onerror = err => {
                console.error(err);

                this.worker = undefined;
            }
        }

        return true;
    }

    public async getInitialParams(): Promise<string | undefined> {
        if (this.worker === undefined) {
            return undefined;
        }

        return await (await fetch(BACKEND_URL + 'c3e068ebf11840ed3fc311a6f2df80b20fa05d25', {
            signal: AbortSignal.timeout(3000),
        })).text();
    }

    public async solveTask(params: string): Promise<string> {
        const signal: AbortSignal = AbortSignal.timeout(1500);

        return new Promise<string>((resolve, reject) => {
           if (this.worker === undefined || signal.aborted || params === undefined) {
               reject();
           }

           signal.addEventListener('abort', reject);

           this.worker.onmessage = (event: MessageEvent<string>) => {
               resolve(event.data)
           };

           this.worker.postMessage(params);
        });
    }
}