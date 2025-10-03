import { InnerworksMetrics, InnerworksResponse } from "@innerworks-me/iw-auth-sdk";

export interface InnerworksConfig {
    appId: string;
    enabled?: boolean;
}

export interface InnerworksResult {
    requestId?: string;
    success: boolean;
    error?: string;
}

export class InnerworksService {
    private innerworksMetrics: InnerworksMetrics | null = null;
    private config: InnerworksConfig;
    private isInitialized: boolean = false;
    private env: 'STG' | 'PROD';

    constructor(config: InnerworksConfig, env: 'STG' | 'PROD') {
        this.config = config;
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
        if (this.config.enabled === false) {
            this.log('[Innerworks] Service disabled by configuration');
            return;
        }

        if (!this.config.appId) {
            this.warn('[Innerworks] App ID not provided, service will not be initialized');
            return;
        }

        try {
            this.innerworksMetrics = new InnerworksMetrics({
                appId: this.config.appId
            });
            this.isInitialized = true;
            this.log('[Innerworks] Service initialized successfully');
        } catch (error) {
            this.error('[Innerworks] Failed to initialize:', error);
        }
    }

    public async collectMetrics(userId: string): Promise<InnerworksResult> {
        if (!this.isInitialized || !this.innerworksMetrics) {
            return {
                success: false,
                error: 'Innerworks service not initialized'
            };
        }

        try {
            const response: InnerworksResponse = await this.innerworksMetrics.send(userId);
            
            if (response.result === 'success') {
                const result: InnerworksResult = {
                    success: true
                };

                // Extract request ID for fingerprinting
                if (response.requestId) {
                    result.requestId = response.requestId;
                }

                return result;
            } else {
                return {
                    success: false,
                    error: `Innerworks collection failed: ${response.result}`
                };
            }
        } catch (error) {
            this.error('[Innerworks] Error collecting metrics:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    public isServiceEnabled(): boolean {
        return this.isInitialized && this.config.enabled !== false;
    }

    public getConfig(): InnerworksConfig {
        return { ...this.config };
    }
}
