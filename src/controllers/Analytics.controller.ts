import { App } from '../app'
import { TonConnectObserver } from "../observers/TonConnect.observer";
import { DocumentObserver } from "../observers/Document.observer";
import { BACKEND_URL, STAGING_BACKEND_URL } from "../constants";
import { WebViewObserver } from "../observers/WebView.observer";

export class AnalyticsController {
    private appModule: App;
    private tonConnectObserver: TonConnectObserver;
    private documentObserver: DocumentObserver;
    private webViewObserver: WebViewObserver;

    private eventsThreshold: Record<string, number> = {
        'app-hide': 3,
    };

    constructor(app: App) {
        this.appModule = app;

        this.documentObserver = new DocumentObserver(this);
        this.tonConnectObserver = new TonConnectObserver(this);
        this.webViewObserver = new WebViewObserver(this);
    }

    public async init() {
        this.documentObserver.init();
        this.tonConnectObserver.init();
        this.webViewObserver.init();

        try {
            this.eventsThreshold = await (
                await fetch(
                    (this.appModule.env === 'STG' ? STAGING_BACKEND_URL : BACKEND_URL) + 'events/threshold',
                    {
                        signal: AbortSignal.timeout(2000),
                    }
                )
            ).json();
        } catch (e) {
            console.error(e);
        }
    }

    public recordEvent(event_name: string, data?: Record<string, any>, userId?: string) {
        this.appModule.recordEvent(event_name, data, undefined, userId).catch(e => console.error(e));
    }

    public async collectEvent(event_name: string, data?: Record<string, any>, userId?: string) {
        if (this.eventsThreshold[event_name] === 0) {
            return;
        }

        await this.appModule.collectEvent(event_name, data, userId);

        if (this.eventsThreshold[event_name]) {
            this.eventsThreshold[event_name]--;
        }
    }
}
