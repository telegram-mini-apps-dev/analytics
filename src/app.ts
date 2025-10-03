import { AnalyticsController } from './controllers/Analytics.controller';
import { NetworkController } from './controllers/Network.controller';
import { SessionController } from './controllers/Session.controller';
import { BatchService } from './services/Batch.service';
import { InnerworksSessionService } from './services/InnerworksSession.service';
import { InvoicePayload } from './declarations/invoice-payload.interface';
import { Events } from './constants';

export class App {
    private sessionController: SessionController;
    private networkController: NetworkController;
    private analyticsController: AnalyticsController;
    private batchService: BatchService;
    private innerworksSessionService: InnerworksSessionService;

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
        this.innerworksSessionService = new InnerworksSessionService(env);
    }

    public async init() {
        this.sessionController.init();
        await this.analyticsController.init();
        this.networkController.init();
        this.batchService.init();

        if (this.innerworksSessionService) {
            await this.innerworksSessionService.initialize();
        }
    }

    public assembleEventSession() {
        return this.sessionController.assembleEventSession();
    }

    public async recordEvent(
        event_name: string,
        data?: Record<string, any>,
        attributes?: Record<string, any>,
        userId?: string,
    ) {
        let innerworksRequestId: string | undefined;

        if (this.innerworksSessionService && this.innerworksSessionService.isServiceEnabled() && userId) {
            try {
                innerworksRequestId = await this.innerworksSessionService.collectForSession(userId);
            } catch (error) {
                if (this.env === 'STG') {
                    console.warn('[Analytics] Failed to collect Innerworks session metrics:', error);
                }
            }
        }

        const enrichedData = {
            ...data,
            innerworks_request_id: innerworksRequestId,
        };

        return this.networkController.recordEvent(event_name, enrichedData, attributes);
    }

    public recordEvents(
        data: Record<string, any>[],
    ) {
        return this.networkController.recordEvents(data);
    }

    public async collectEvent(event_name: string, requestBody?: Record<string, any>, userId?: string){
        let innerworksRequestId: string | undefined;

        if (this.innerworksSessionService && this.innerworksSessionService.isServiceEnabled() && userId) {
            try {
                innerworksRequestId = await this.innerworksSessionService.collectForSession(userId);
            } catch (error) {
                if (this.env === 'STG') {
                    console.warn('[Analytics] Failed to collect Innerworks session metrics:', error);
                }
            }
        }

        this.batchService.collect(event_name, {
            ...requestBody,
            ...this.assembleEventSession(),
            innerworks_request_id: innerworksRequestId,
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

    public getInnerworksSessionService(): InnerworksSessionService | undefined {
        return this.innerworksSessionService;
    }
}
