import { AnalyticsController } from './controllers/Analytics.controller'
import { NetworkController } from './controllers/Network.controller'
import { SessionController } from './controllers/Session.controller'
import { BatchService } from "./services/Batch.service";
import { HumanProofService } from "./services/HumanProof.service";
import {InvoicePayload} from "../declaration";
import {Events} from "./constants";

export class App {
    private sessionController: SessionController;
    private networkController: NetworkController;
    private analyticsController: AnalyticsController;
    private batchService: BatchService;
    private humanProofService: HumanProofService;

    private readonly apiToken: string;
    private readonly appName: string;

    public taskParams: string | undefined | null = null;

    public env: 'STG' | 'PROD';

    constructor(apiToken: string, appName: string, env: 'STG' | 'PROD') {
        this.env = env;

        this.apiToken = apiToken;
        this.appName = appName;
        this.humanProofService = new HumanProofService(this);
        this.sessionController = new SessionController(this);
        this.networkController = new NetworkController(this);
        this.analyticsController = new AnalyticsController(this);
        this.batchService = new BatchService(this);
    }

    public async init() {
        this.sessionController.init();
        await this.analyticsController.init();
        await this.humanProofService.init().catch(e => console.error(e));
        this.networkController.init();
        this.batchService.init();
    }

    public assembleEventSession() {
        return this.sessionController.assembleEventSession();
    }

    public recordEvent(
        event_name: string,
        data?: Record<string, any>,
        attributes?: Record<string, any>,
    ) {
        return this.networkController.recordEvent(event_name, data, attributes);
    }

    public recordEvents(
        data: Record<string, any>[],
    ) {
        return this.networkController.recordEvents(data);
    }

    public collectEvent(event_name: string, requestBody?: Record<string, any>){
        this.batchService.collect(event_name, {
            ...requestBody,
            ...this.assembleEventSession(),
        });
    }

    public registerInvoice(invoicePayload: InvoicePayload) {
        this.batchService.collect(Events.INVOICE_REGISTERED, {
            ...invoicePayload,
            ...this.assembleEventSession(),
        });
    }

    public getApiToken() {
        return this.apiToken;
    }

    public getAppName() {
        return this.appName;
    }

    public async solveHumanProofTask(): Promise<string | undefined> {
        if (this.taskParams === null) {
            this.taskParams = await this.humanProofService.getInitialParams().catch(_err => undefined);
        }

        return await this.humanProofService.solveTask(this.taskParams).catch(_err => undefined);
    }
}
