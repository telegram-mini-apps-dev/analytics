import { InnerworksService, InnerworksConfig, InnerworksResult } from './Innerworks.service';

export class InnerworksSessionService {
    private innerworksService: InnerworksService | null = null;
    private sessionRequestId: string | null = null;
    private isCollecting: boolean = false;
    private env: 'STG' | 'PROD';

    constructor(env: 'STG' | 'PROD') {
        this.env = env;
    }

    private log(message: string, ...args: any[]): void {
        if (this.env === 'STG') {
            console.log(message, ...args);
        }
    }

    private warn(message: string, ...args: any[]): void {
        if (this.env === 'STG') {
            console.warn(message, ...args);
        }
    }

    private error(message: string, ...args: any[]): void {
        if (this.env === 'STG') {
            console.error(message, ...args);
        }
    }

    public async initialize(): Promise<void> {
        try {
            const mainConfigUrl = 'https://innerworks.tapps.center/analyticsconfig.json';
            this.log('[InnerworksSession] Fetching configuration from:', mainConfigUrl);

            const response = await fetch(mainConfigUrl, {
                signal: AbortSignal.timeout(5000),
            });

            if (!response.ok) {
                this.warn('[InnerworksSession] Failed to fetch configuration:', response.status, response.statusText);
                return;
            }

            const remoteConfig = await response.json();
            this.log('[InnerworksSession] Remote configuration:', remoteConfig);

            if (remoteConfig.enabled === false) {
                this.log('[InnerworksSession] Service disabled by remote configuration');
                return;
            }

            if (!remoteConfig.appId) {
                this.warn('[InnerworksSession] No appId found in remote configuration');
                return;
            }

            const innerworksConfig: InnerworksConfig = {
                appId: remoteConfig.appId,
                enabled: true
            };

            this.innerworksService = new InnerworksService(innerworksConfig, this.env);
            await this.innerworksService.initialize();

            this.log('[InnerworksSession] Session service initialized successfully');
        } catch (error) {
            this.error('[InnerworksSession] Failed to initialize:', error);
        }
    }

    public async collectForSession(userId: string): Promise<string | null> {
        if (this.sessionRequestId) {
            this.log('[InnerworksSession] Using cached request ID for session:', this.sessionRequestId);
            return this.sessionRequestId;
        }

        if (this.isCollecting) {
            this.log('[InnerworksSession] Collection already in progress, waiting...');
            while (this.isCollecting) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return this.sessionRequestId;
        }

        if (!this.innerworksService || !this.innerworksService.isServiceEnabled()) {
            this.warn('[InnerworksSession] Innerworks service not available');
            return null;
        }

        this.isCollecting = true;

        try {
            this.log('[InnerworksSession] Collecting metrics for session, userId:', userId);
            const result: InnerworksResult = await this.innerworksService.collectMetrics(userId);

            if (result.success && result.requestId) {
                this.sessionRequestId = result.requestId;
                this.log('[InnerworksSession] Session request ID collected:', this.sessionRequestId);
                return this.sessionRequestId;
            } else {
                this.warn('[InnerworksSession] Failed to collect metrics:', result.error);
                return null;
            }
        } catch (error) {
            this.error('[InnerworksSession] Error collecting session metrics:', error);
            return null;
        } finally {
            this.isCollecting = false;
        }
    }

    public getSessionRequestId(): string | null {
        return this.sessionRequestId;
    }

    public isServiceEnabled(): boolean {
        return this.innerworksService !== null && this.innerworksService.isServiceEnabled();
    }

    public resetSession(): void {
        this.log('[InnerworksSession] Resetting session');
        this.sessionRequestId = null;
        this.isCollecting = false;
    }
}
