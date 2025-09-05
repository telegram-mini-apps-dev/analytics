import { App } from './app'
import { InvoicePayload } from "../declaration";
import { validateInvoicePayload } from "./validators/invoice-payload.validator";

let __registerInvoice: (invoicePayload: InvoicePayload) => void;

async function init({ token, appName, env = 'PROD'}: {
    token: string,
    appName: string,
    env?: 'STG' | 'PROD',
}) {
    if (window.__TELEGRAM_APPS_ANALYTICS) {
        return;
    }

    window.__TELEGRAM_APPS_ANALYTICS = 1;

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