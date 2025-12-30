import { AnalyticsController } from './controllers/Analytics.controller'
import { NetworkController } from './controllers/Network.controller'
import { SessionController } from './controllers/Session.controller'
import { BatchService } from './services/Batch.service';
import {InvoicePayload} from './declarations/invoice-payload.interface';
import {Events} from './constants';
import { InnerworksMetrics } from "@innerworks-me/iw-auth-sdk";
import { ConnectionCompletedEvent } from "@tonconnect/ui";

export class App {
    private sessionController: SessionController;
    private networkController: NetworkController;
    private analyticsController: AnalyticsController;
    private batchService: BatchService;
    private innerworksMetrics: InnerworksMetrics;

    private readonly apiToken: string;
    private readonly appName: string;

    public env: 'STG' | 'PROD';

    constructor(apiToken: string, appName: string, env: 'STG' | 'PROD') {
        this.env = env;

        this.apiToken = apiToken;
        this.appName = appName;
        this.sessionController = new SessionController(this);
        this.networkController = new NetworkController(this);
        this.analyticsController = new AnalyticsController(this);
        this.batchService = new BatchService(this);
        this.innerworksMetrics = new InnerworksMetrics({
            appId: '89ee9d10-759b-49c1-84c6-3bcbd564de4b',
        });
    }

    public async init() {
        this.sessionController.init();
        await this.analyticsController.init();
        this.networkController.init();
        this.batchService.init();
        window.addEventListener(
            'ton-connect-connection-completed',
            async (event: CustomEvent<ConnectionCompletedEvent>) => {
                const resp = await this.innerworksMetrics.sendMetrics(event.detail.wallet_address);
                if (resp.result === 'success') {
                    this.networkController.recordFingerprint(event.detail.wallet_address, resp.requestId);
                };
            }
        );
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
}
