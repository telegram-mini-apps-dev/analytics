import { retrieveLaunchParams, type RetrieveLPResultCamelCased } from '@telegram-apps/sdk';
import { WebAppUser } from '@twa-dev/types'
import { App } from '../app'
import { Errors, throwError } from '../errors'
import { generateUUID } from '../utils/generateUUID';

export class SessionController {
    private sessionId: string;
    private userId: number;
    private userData: WebAppUser;
    private platform: string;
    private webAppStartParam: string;
    private userLocale: string;

    private appModule: App;

    constructor(app: App) {
        this.appModule = app;
    }

    public init() {
        const lp = retrieveLaunchParams(true) as RetrieveLPResultCamelCased;
        const initData = lp.tgWebAppData;
        const user = initData?.user;
        if (!user) {
            throwError(Errors.USER_DATA_IS_NOT_PROVIDED);
        }

        this.userData = {
            id: user.id,
            is_premium: user.isPremium,
            first_name: user.firstName,
            is_bot: user.isBot,
            last_name: user.lastName,
            language_code: user.languageCode,
            photo_url: user.photoUrl,
            username: user.username,
        };
        this.userId = user.id;
        this.userLocale = user.languageCode;
        this.webAppStartParam = initData?.startParam ?? '';
        this.platform = lp.tgWebAppPlatform;
        this.sessionId = generateUUID(String(this.getUserId()));
    }

    public getSessionId() {
        return this.sessionId;
    }

    public getUserId() {
        return this.userId;
    }

    public getWebAppStartParam() {
        return this.webAppStartParam;
    }

    public getPlatform(){
        return this.platform;
    }

    public getUserLocale() {
        return this.userLocale;
    }

    public getUserData() {
        return this.userData;
    }

    public getUserIsPremium() {
        const userData = this.getUserData();

        return Boolean(userData?.is_premium);
    }

    public assembleEventSession() {
        return {
            session_id: this.getSessionId(),
            user_id: this.getUserId(),
            app_name: this.appModule.getAppName(),
            is_premium: this.getUserIsPremium(),
            platform: this.getPlatform(),
            locale: this.getUserLocale(),
            start_param: this.getWebAppStartParam(),
            client_timestamp: String(Date.now()),
        }
    }
}
