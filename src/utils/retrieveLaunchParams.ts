import { WebAppInitData } from "../../declaration";
import { throwError } from "../errors";

export interface LaunchParams {
    initDataRaw?: string;
    tgWebAppData?: WebAppInitData;
    version?: string;
    platform?: string;
    colorScheme?: 'light' | 'dark';
    [key: string]: any;
}

function parseInitDataRaw(raw: string): WebAppInitData {
    const parsed: Record<string, any> = {};
    const searchParams = new URLSearchParams(raw);

    searchParams.forEach((value, key) => {
        try {
            parsed[key] = JSON.parse(value);
        } catch {
            parsed[key] = value;
        }
    });

    return parsed as WebAppInitData;
}

export function retrieveLaunchParams(): LaunchParams {
    const hash = window.location.hash.substring(1);
    const params: LaunchParams = {};

    if (!hash) {
        throwError('Can`t retrieve launch params');
    }

    hash.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        if (key && value) {
            try {
                const decoded = decodeURIComponent(value);
                try {
                    params[key] = JSON.parse(decoded);
                } catch {
                    params[key] = decoded;
                }
            } catch {}
        }
    });

    if (typeof params.tgWebAppData === 'string') {
        params.tgWebAppData = parseInitDataRaw(params.tgWebAppData);
    }

    return params;
}