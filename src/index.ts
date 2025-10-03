import { App } from './app'
import { InvoicePayload } from "./declarations/invoice-payload.interface";
import { AnalyticsEvent, BatchedAnalyticsEvent } from "./declarations/analytics-event.interface";
import { InnerworksSessionService } from "./services/InnerworksSession.service";
import {validateInvoicePayload} from "./validators/invoice-payload.validator";

let __registerInvoice: (invoicePayload: InvoicePayload) => void;

async function init({ token, appName, env = 'PROD'}: {
    token: string,
    appName: string,
    env?: 'STG' | 'PROD',
}) {
    const app = new App(token, appName, env);

    __registerInvoice = (invoicePayload: InvoicePayload) => {
        validateInvoicePayload(invoicePayload);
        app.registerInvoice(invoicePayload);
    }

    await app.init();
}

export default {
    init,
    registerInvoice: (invoicePayload: InvoicePayload) => __registerInvoice(invoicePayload),
};

export { App };
export { InvoicePayload };
export { AnalyticsEvent, BatchedAnalyticsEvent };
export { InnerworksSessionService };
