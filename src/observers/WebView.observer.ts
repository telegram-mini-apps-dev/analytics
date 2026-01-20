import { AnalyticsController } from "../controllers/Analytics.controller";
import { Events } from "../constants";

export class WebViewObserver {
    private analyticsController: AnalyticsController;

    private readonly eventStatusMap = {
        paid: Events.PURCHASE_SUCCESS,
        cancelled: Events.PURCHASE_CANCELLED,
        failed: Events.PURCHASE_FAILED,
    }

    constructor(analyticsController: AnalyticsController) {
        this.analyticsController = analyticsController;
    }

    public init() {
        window.addEventListener('message', ({ data }) => {
            try {
                const { eventType, eventData } = JSON.parse(data);
                this.handleEvents(eventType, eventData);
            } catch(e) {}
          });
        this.handlePlatformListener(window.TelegramGameProxy);
        this.handlePlatformListener(window.Telegram.WebView);
        this.handlePlatformListener(window.TelegramGameProxy_receiveEvent);

        this.initPostEventBus();
    }

    private handlePlatformListener(listener: any) {
        if (!listener) {
            return;
        }

        const observer = this;

        if (listener?.receiveEvent) {
            listener.receiveEvent = (eventType: string, eventData: unknown) => {
                observer.handleEvents(eventType, eventData as Record<string, any>);

                window.Telegram.WebView.callEventCallbacks(eventType, function(callback) {
                    callback(eventType, eventData);
                });
            }
        } else {
            window.TelegramGameProxy_receiveEvent = (eventType: string, eventData: unknown) => {
                observer.handleEvents(eventType, eventData as Record<string, any>);

                window.Telegram.WebView.callEventCallbacks(eventType, function(callback) {
                    callback(eventType, eventData);
                });
            }
        }
    }

    private handleEvents(eventType: string, eventData: Record<string, any>) {
        if (eventType === 'invoice_closed') {
            if (this.eventStatusMap[eventData.status]) {
                this.analyticsController.collectEvent(this.eventStatusMap[eventData.status], {
                    slug: eventData.slug,
                });
            }
        }
    }

    private initPostEventBus() {
        window.Telegram.WebView.postEvent = (eventType, callback, eventData) => {
            this.originalPostEvent(eventType, callback, eventData);
            if (eventType === 'web_app_open_invoice') {
                let slug = eventData.slug;

                if (slug.startsWith('$')){
                    slug = slug.slice(1);
                }

                this.analyticsController.collectEvent(Events.PURCHASE_INIT, {
                    slug
                });
            }
        };
    }

    private originalPostEvent(eventType, callback, eventData) {
        if (!callback) {
            callback = function () {};
        }
        if (eventData === undefined) {
            eventData = '';
        }
        console.log('[Telegram.WebView] > postEvent', eventType, eventData);

        if (window.TelegramWebviewProxy !== undefined) {
            window.TelegramWebviewProxy.postEvent(eventType, JSON.stringify(eventData));
            callback();
        }
        else if (window.external && 'notify' in window.external && typeof window.external.notify === 'function') {
            window.external.notify(JSON.stringify({eventType: eventType, eventData: eventData}));
            callback();
        }
        else if (window.Telegram.WebView?.isIframe) {
            try {
                var trustedTarget = 'https://web.telegram.org';
                // For now we don't restrict target, for testing purposes
                trustedTarget = '*';
                window.parent.postMessage(JSON.stringify({eventType: eventType, eventData: eventData}), trustedTarget);
                callback();
            } catch (e) {
                callback(e);
            }
        }
        else {
            callback({notAvailable: true});
        }
    };
}